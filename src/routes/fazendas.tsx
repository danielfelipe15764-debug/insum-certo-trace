import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileDown, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/insum/store";
import { SatMap } from "@/components/insum/SatMap";
import type { MapPin as Pin } from "@/components/insum/map-types";
import { calcularEstouro, faixaEstouro, faixaHex, faixaLabel, fmtEstouro } from "@/lib/insum/estouro";
import { fmtCoord } from "@/lib/insum/geo";
import type { Fazenda } from "@/lib/insum/types";

export const Route = createFileRoute("/fazendas")({
  head: () => ({
    meta: [
      { title: "Fazendas e talhões · Insumo Certo" },
      {
        name: "description",
        content: "Mapa de satélite de cada fazenda com talhões, sede e aplicações coloridas pelo estouro, com download em PDF.",
      },
      { property: "og:title", content: "Fazendas e talhões · Insumo Certo" },
      { property: "og:description", content: "Talhões no mapa de satélite, aplicações por faixa de estouro e mapa em PDF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Fazendas,
});

function Fazendas() {
  const { data } = useApp();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Fazendas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Talhões, sede e aplicações no mapa de satélite.</p>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {(["padrao", "atencao", "critico"] as const).map((f) => (
          <span key={f} className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: faixaHex[f] }} /> {faixaLabel[f]}
          </span>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {data.fazendas.map((f) => <CartaoFazenda key={f.id} f={f} />)}
      </div>
    </div>
  );
}

function CartaoFazenda({ f }: { f: Fazenda }) {
  const { data, produto, eventosDe } = useApp();
  const [gerando, setGerando] = useState(false);
  const area = f.talhoes.reduce((s, t) => s + t.areaHa, 0);
  const insumos = data.insumos.filter((i) => i.fazendaId === f.id);
  const aplicacoes = insumos.flatMap((i) => {
    const est = calcularEstouro(i);
    const ev = eventosDe(i.id).filter((e) => e.tipo === "aplicacao").pop();
    if (!est || !ev) return [];
    const p = produto(i.produtoId);
    return [{ i, est, ev, p, un: i.unidade ?? p?.unidade ?? "", hex: faixaHex[faixaEstouro(est.percentual, data.config)] }];
  });

  const pins: Pin[] = [
    { id: "sede", lat: f.sede.lat, lng: f.sede.lng, cor: "#1e293b", letra: "S", titulo: "Sede", linhas: [f.nome, fmtCoord(f.sede.lat, f.sede.lng)] },
    ...aplicacoes.map((a) => ({
      id: a.i.id,
      lat: a.ev.lat,
      lng: a.ev.lng,
      cor: a.hex,
      letra: "A",
      titulo: a.p?.nome ?? "Aplicação",
      linhas: [
        `${a.i.qrCode} · lote ${a.i.lote}`,
        `Recomendado ${a.est.recomendado} ${a.un} · aplicado ${a.est.aplicado} ${a.un}`,
        `Estouro: ${fmtEstouro(a.est.percentual)}`,
        fmtCoord(a.ev.lat, a.ev.lng),
      ],
    })),
  ];

  async function baixar() {
    setGerando(true);
    try {
      const { baixarPdfFazenda } = await import("@/lib/insum/mapa-pdf");
      const linhas = f.talhoes.flatMap((t) => {
        const ap = aplicacoes.filter((a) => a.i.talhaoId === t.id);
        if (!ap.length) return [{ talhao: t.nome, area: String(t.areaHa), produto: "—", recomendado: "—", aplicado: "—", estouro: "—" }];
        return ap.map((a, k) => ({
          talhao: k ? "" : t.nome,
          area: k ? "" : String(t.areaHa),
          produto: a.p?.nome ?? "",
          recomendado: `${a.est.recomendado} ${a.un}`,
          aplicado: `${a.est.aplicado} ${a.un}`,
          estouro: `${fmtEstouro(a.est.percentual)} · ${faixaLabel[faixaEstouro(a.est.percentual, data.config)]}`,
          hex: a.hex,
        }));
      });
      const sat = await baixarPdfFazenda(
        f,
        aplicacoes.map((a) => ({ lat: a.ev.lat, lng: a.ev.lng, hex: a.hex })),
        linhas,
        { atencao: data.config.limiteAtencao, critico: data.config.limiteCritico },
      );
      toast.success(sat ? "PDF gerado com imagem de satélite" : "PDF gerado com mapa esquemático");
    } catch {
      toast.error("Não foi possível gerar o PDF.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
            <MapPin className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-extrabold text-foreground">{f.nome}</h2>
            <p className="truncate text-xs text-muted-foreground">
              {f.municipio} · {area.toLocaleString("pt-BR")} ha · {f.talhoes.length} talhões · {aplicacoes.length} aplicações
            </p>
          </div>
        </div>
        <button
          onClick={baixar}
          disabled={gerando}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} Baixar mapa em PDF
        </button>
      </div>

      <div className="mt-4">
        <SatMap
          altura={320}
          pins={pins}
          poligonos={f.talhoes.map((t) => ({ id: t.id, pontos: t.poligono, nome: `${t.nome} · ${t.areaHa} ha` }))}
        />
      </div>

      <ul className="mt-3 divide-y divide-border">
        {f.talhoes.map((t) => {
          const ap = aplicacoes.filter((a) => a.i.talhaoId === t.id);
          return (
            <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{t.nome}</p>
                <p className="text-xs text-muted-foreground">{t.areaHa} ha</p>
              </div>
              <div className="flex flex-wrap justify-end gap-1">
                {ap.length === 0 && <span className="text-xs text-muted-foreground">sem aplicações</span>}
                {ap.map((a) => (
                  <span key={a.i.id} className="rounded-full px-2 py-0.5 text-xs font-bold text-primary-foreground" style={{ background: a.hex }}>
                    {fmtEstouro(a.est.percentual)}
                  </span>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
