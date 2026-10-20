import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { QrCode, Search, Package, Truck, MapPin, Sprout } from "lucide-react";
import { fmtDataHora, useApp } from "@/lib/insum/store";
import { StatusBadge } from "@/components/insum/StatusBadge";
import { RouteTrackingMap } from "@/components/insum/RouteTrackingMap";
import { EstouroBadge } from "@/components/insum/EstouroBadge";
import { Coordenadas } from "@/components/insum/Coordenadas";
import { calcularEstouro } from "@/lib/insum/estouro";

export const Route = createFileRoute("/rastreabilidade")({
  validateSearch: (s: Record<string, unknown>) => ({ qr: typeof s["qr"] === "string" ? (s["qr"] as string) : "" }),
  head: () => ({
    meta: [
      { title: "Rastreabilidade · Insumo Certo" },
      {
        name: "description",
        content: "Linha do tempo completa por QR Code: cadastro, saída, transporte, chegada e aplicação, com responsável e horário.",
      },
      { property: "og:title", content: "Rastreabilidade · Insumo Certo" },
      { property: "og:description", content: "Histórico permanente de cada leitura de QR Code do insumo agrícola." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Rastreabilidade,
});

const icones = { cadastro: Package, saida: Truck, chegada: MapPin, aplicacao: Sprout };

function Rastreabilidade() {
  const { qr } = Route.useSearch();
  const { data, produto, fazenda, ordem, talhaoNome, eventosDe } = useApp();
  const [busca, setBusca] = useState(qr);
  const [selecionado, setSelecionado] = useState<string>(
    data.insumos.find((i) => i.qrCode === qr)?.id ?? data.insumos[0]?.id ?? "",
  );

  const lista = data.insumos.filter((i) => {
    const p = produto(i.produtoId);
    const t = busca.toLowerCase();
    return !t || i.qrCode.toLowerCase().includes(t) || p?.nome.toLowerCase().includes(t) || i.lote.toLowerCase().includes(t);
  });
  const insumo = data.insumos.find((i) => i.id === selecionado);
  const eventos = insumo ? eventosDe(insumo.id) : [];
  const est = insumo ? calcularEstouro(insumo) : null;
  const un = insumo ? insumo.unidade ?? produto(insumo.produtoId)?.unidade ?? "" : "";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Rastreabilidade</h1>
        <p className="mt-1 text-sm text-muted-foreground">Histórico permanente de cada QR Code, do almoxarifado à aplicação.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-border bg-card p-3 shadow-card">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar QR, produto ou lote"
              maxLength={40}
              className="h-11 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <ul className="mt-3 max-h-[520px] space-y-2 overflow-y-auto">
            {lista.map((i) => (
              <li key={i.id}>
                <button
                  onClick={() => setSelecionado(i.id)}
                  className={`w-full rounded-xl border p-3 text-left ${
                    selecionado === i.id ? "border-primary bg-accent" : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-bold text-foreground">{i.qrCode}</span>
                    <StatusBadge status={i.status} />
                  </div>
                  <p className="mt-1 truncate text-sm text-foreground">{produto(i.produtoId)?.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {ordem(i.osId)?.codigo} · {fazenda(i.fazendaId)?.nome}
                  </p>
                </button>
              </li>
            ))}
            {lista.length === 0 && <li className="p-3 text-sm text-muted-foreground">Nenhum insumo encontrado.</li>}
          </ul>
        </div>

        {insumo && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
                    <QrCode className="h-4 w-4 shrink-0" /> {insumo.qrCode}
                  </p>
                  <h2 className="mt-1 truncate text-xl font-extrabold text-foreground">{produto(insumo.produtoId)?.nome}</h2>
                </div>
                <StatusBadge status={insumo.status} />
              </div>
              {est && (
                <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-secondary px-3 py-2.5">
                  <span className="text-sm text-muted-foreground">Recomendado <b className="text-foreground">{est.recomendado} {un}</b></span>
                  <span className="text-muted-foreground">×</span>
                  <span className="text-sm text-muted-foreground">Aplicado <b className="text-foreground">{est.aplicado} {un}</b></span>
                  <EstouroBadge percentual={est.percentual} className="text-sm" />
                </div>
              )}
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
                <Info k="Nota fiscal" v={insumo.notaFiscal} />
                <Info k="Lote" v={insumo.lote} />
                <Info k="Vencimento" v={new Date(insumo.vencimento + "T12:00:00").toLocaleDateString("pt-BR")} />
                <Info k="Quantidade retirada" v={`${insumo.quantidade} ${produto(insumo.produtoId)?.unidade}`} />
                <Info
                  k="Quantidade aplicada"
                  v={insumo.quantidadeAplicada !== undefined ? `${insumo.quantidadeAplicada} ${produto(insumo.produtoId)?.unidade}` : "—"}
                />
                <Info k="Ordem de serviço" v={ordem(insumo.osId)?.codigo ?? "—"} />
                <Info k="Fazenda" v={fazenda(insumo.fazendaId)?.nome ?? "—"} />
                <Info k="Talhão" v={talhaoNome(insumo.fazendaId, insumo.talhaoId)} />
                <Info k="Veículo" v={insumo.veiculo ?? "—"} />
                <Info k="Motorista" v={insumo.motorista ?? "—"} />
              </dl>
            </div>

            <RouteTrackingMap insumo={insumo} eventos={eventos} />

            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <h3 className="text-sm font-bold text-foreground">Linha do tempo</h3>
              <ol className="mt-4 space-y-0">
                {eventos.map((e, idx) => {
                  const Icone = icones[e.tipo];
                  return (
                    <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
                      {idx < eventos.length - 1 && <span className="absolute left-[19px] top-10 h-full w-0.5 bg-border" />}
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                        <Icone className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground">
                          {e.tipo === "cadastro"
                            ? "Cadastro e geração do QR Code"
                            : e.tipo === "saida"
                              ? "Saída do almoxarifado"
                              : e.tipo === "chegada"
                                ? "Chegada na fazenda"
                                : "Aplicação no campo"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fmtDataHora(e.dataHora)} · {e.responsavel} ({e.perfil}) · {e.local}
                        </p>
                        <p className="mt-1 text-sm text-foreground/85">{e.detalhe}</p>
                        <div className="mt-1.5"><Coordenadas lat={e.lat} lng={e.lng} simulada={e.localizacaoSimulada} /></div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="truncate font-semibold text-foreground">{v}</dd>
    </div>
  );
}
