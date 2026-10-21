import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Gauge, PackagePlus, ShieldCheck, Truck } from "lucide-react";
import { useApp } from "@/lib/insum/store";
import { calcularEstouro, faixaCor, faixaEstouro, fmtEstouro } from "@/lib/insum/estouro";
import { EstouroBadge } from "@/components/insum/EstouroBadge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel gerencial · Insumo Certo" },
      {
        name: "description",
        content: "Painel gerencial de estouro de aplicação de insumos agrícolas por fazenda, produto e talhão.",
      },
      { property: "og:title", content: "Painel gerencial · Insumo Certo" },
      { property: "og:description", content: "O que foi aplicado, onde houve estouro e quanto isso representa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const media = (v: number[]) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0);

function Dashboard() {
  const { data, produto, fazenda, talhaoNome, eventosDe } = useApp();
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [fazendaId, setFazendaId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const cfg = data.config;

  const aplicacoes = useMemo(
    () =>
      data.insumos.flatMap((i) => {
        const est = calcularEstouro(i);
        const ev = eventosDe(i.id).filter((e) => e.tipo === "aplicacao").pop();
        if (!est || !ev) return [];
        const dia = ev.dataHora.slice(0, 10);
        if (de && dia < de) return [];
        if (ate && dia > ate) return [];
        if (fazendaId && i.fazendaId !== fazendaId) return [];
        if (produtoId && i.produtoId !== produtoId) return [];
        const p = produto(i.produtoId);
        return [{ i, est, data: ev.dataHora, p, un: i.unidade ?? p?.unidade ?? "", faixa: faixaEstouro(est.percentual, cfg) }];
      }),
    [data, de, ate, fazendaId, produtoId, cfg, eventosDe, produto],
  );

  const estouroMedio = media(aplicacoes.map((a) => a.est.percentual));
  const excedente = Object.entries(
    aplicacoes.reduce<Record<string, number>>((acc, a) => ({ ...acc, [a.un]: (acc[a.un] ?? 0) + a.est.excedente }), {}),
  ).filter(([, v]) => v > 0);
  const criticos = aplicacoes.filter((a) => a.faixa === "critico").length;
  const pctPadrao = aplicacoes.length ? (aplicacoes.filter((a) => a.faixa === "padrao").length / aplicacoes.length) * 100 : 0;

  const porFazenda = data.fazendas
    .map((f) => {
      const v = aplicacoes.filter((a) => a.i.fazendaId === f.id).map((a) => a.est.percentual);
      return { nome: f.nome.replace("Fazenda ", ""), estouro: Number(media(v).toFixed(1)), n: v.length };
    })
    .filter((x) => x.n > 0);
  const porProduto = data.produtos
    .map((p) => {
      const v = aplicacoes.filter((a) => a.i.produtoId === p.id).map((a) => a.est.percentual);
      return { nome: p.nome, estouro: Number(media(v).toFixed(1)), n: v.length };
    })
    .filter((x) => x.n > 0)
    .sort((a, b) => b.estouro - a.estouro);
  const top5 = [...aplicacoes].sort((a, b) => b.est.percentual - a.est.percentual).slice(0, 5);

  const cont = (s: string) => data.insumos.filter((i) => i.status === s).length;
  const abertas = data.divergencias.filter((d) => !d.resolvida).length;
  const corBarra = (v: number) => faixaCor[faixaEstouro(v, cfg)];

  const total = data.insumos.length || 1;
  const etapas = [
    { s: "pendente", k: "No almoxarifado", cor: "var(--muted-foreground)" },
    { s: "em_transporte", k: "Em transporte", cor: "var(--info)" },
    { s: "entregue", k: "Entregues na fazenda", cor: "var(--warning)" },
    { s: "aplicado", k: "Aplicados no talhão", cor: "var(--success)" },
  ];
  const ultimos = [...data.eventos].sort((a, b) => b.dataHora.localeCompare(a.dataHora)).slice(0, 8);
  const emRota = data.insumos.filter((i) => i.status === "em_transporte");
  const nomeEtapa: Record<string, string> = { cadastro: "Cadastro", saida: "Retirada", chegada: "Chegada", aplicacao: "Aplicação" };

  return (
    <div className="space-y-5">
      <Painel titulo="Rastreabilidade dos insumos">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {etapas.map((e) => {
            const n = cont(e.s);
            return (
              <div key={e.s} className="rounded-xl border border-border p-3" style={{ borderLeft: `4px solid ${e.cor}` }}>
                <p className="text-xs font-semibold text-muted-foreground">{e.k}</p>
                <p className="mt-1 text-3xl font-extrabold text-foreground">{n}</p>
                <div className="mt-2 h-1.5 rounded-full bg-muted">
                  <div className="h-1.5 rounded-full" style={{ width: `${(n / total) * 100}%`, background: e.cor }} />
                </div>
              </div>
            );
          })}
        </div>
      </Painel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Painel titulo="Últimas movimentações">
          <ul className="divide-y divide-border text-sm">
            {ultimos.map((ev) => {
              const ins = data.insumos.find((i) => i.id === ev.insumoId);
              return (
                <li key={ev.id} className="flex items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {nomeEtapa[ev.tipo]} · {ins ? produto(ins.produtoId)?.nome : ""}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{ev.local} · {ev.responsavel}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {ins && <Link to="/rastreabilidade" search={{ qr: ins.qrCode }} className="text-xs font-semibold text-primary hover:underline">{ins.qrCode}</Link>}
                    <p className="text-xs text-muted-foreground">{new Date(ev.dataHora).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Painel>
        <Painel titulo={`Em transporte agora (${emRota.length})`}>
          <ul className="divide-y divide-border text-sm">
            {emRota.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{produto(i.produtoId)?.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    → {fazenda(i.fazendaId)?.nome} · {talhaoNome(i.fazendaId, i.talhaoId)}{i.motorista ? ` · ${i.motorista}` : ""}
                  </p>
                </div>
                <Link to="/rastreabilidade" search={{ qr: i.qrCode }} className="shrink-0 text-xs font-semibold text-primary hover:underline">Rastrear</Link>
              </li>
            ))}
            {emRota.length === 0 && <li className="py-6 text-center text-muted-foreground">Nenhum insumo em transporte.</li>}
          </ul>
        </Painel>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Painel gerencial</h1>
          <p className="mt-1 text-sm text-muted-foreground">{aplicacoes.length} aplicações analisadas</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <Chip icon={Truck} v={cont("em_transporte")} k="em transporte" />
          <Chip icon={PackagePlus} v={cont("pendente")} k="pendentes" />
          <Link to="/divergencias"><Chip icon={AlertTriangle} v={abertas} k="divergências" alerta={abertas > 0} /></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-3 shadow-card lg:grid-cols-4">
        <Campo label="De"><input type="date" value={de} onChange={(e) => setDe(e.target.value)} className={inputCls} /></Campo>
        <Campo label="Até"><input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className={inputCls} /></Campo>
        <Campo label="Fazenda">
          <select value={fazendaId} onChange={(e) => setFazendaId(e.target.value)} className={inputCls}>
            <option value="">Todas</option>
            {data.fazendas.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </Campo>
        <Campo label="Produto">
          <select value={produtoId} onChange={(e) => setProdutoId(e.target.value)} className={inputCls}>
            <option value="">Todos</option>
            {data.produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi icon={Gauge} titulo="Estouro médio geral" valor={aplicacoes.length ? fmtEstouro(estouroMedio) : "—"} cor={corBarra(estouroMedio)} />
        <Kpi
          icon={AlertTriangle}
          titulo="Volume excedente"
          valor={excedente.length ? excedente.map(([u, v]) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${u}`).join(" · ") : "0"}
          cor="var(--warning)"
          pequeno={excedente.length > 1}
        />
        <Kpi icon={AlertTriangle} titulo="Aplicações críticas" valor={String(criticos)} cor="var(--destructive)" />
        <Kpi icon={ShieldCheck} titulo="Dentro do padrão" valor={`${pctPadrao.toFixed(0)}%`} cor="var(--success)" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Painel titulo="Estouro % por fazenda">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={porFazenda} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="nome" tick={{ fontSize: 11 }} interval={0} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <ReferenceLine y={0} stroke="var(--muted-foreground)" />
              <Tooltip formatter={(v: number) => fmtEstouro(v)} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="estouro" name="Estouro médio" radius={[6, 6, 0, 0]} label={{ position: "top", fontSize: 11, formatter: (v: number) => fmtEstouro(v) }}>
                {porFazenda.map((x) => <Cell key={x.nome} fill={corBarra(x.estouro)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Painel>
        <Painel titulo="Estouro % por produto">
          <ResponsiveContainer width="100%" height={Math.max(220, porProduto.length * 38)}>
            <BarChart data={porProduto} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
              <YAxis type="category" dataKey="nome" width={130} tick={{ fontSize: 11 }} />
              <ReferenceLine x={0} stroke="var(--muted-foreground)" />
              <Tooltip formatter={(v: number) => fmtEstouro(v)} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="estouro" name="Estouro médio" radius={[0, 6, 6, 0]} label={{ position: "right", fontSize: 11, formatter: (v: number) => fmtEstouro(v) }}>
                {porProduto.map((x) => <Cell key={x.nome} fill={corBarra(x.estouro)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Painel>
      </div>

      <Painel titulo="Top 5 maiores estouros">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                {["Fazenda", "Talhão", "Produto", "Recomendado", "Aplicado", "Estouro", "Data"].map((c) => <th key={c} className="px-2 py-2">{c}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {top5.map((a) => (
                <tr key={a.i.id}>
                  <td className="px-2 py-2.5 font-semibold text-foreground">{fazenda(a.i.fazendaId)?.nome.replace("Fazenda ", "")}</td>
                  <td className="px-2 py-2.5 text-muted-foreground">{talhaoNome(a.i.fazendaId, a.i.talhaoId)}</td>
                  <td className="px-2 py-2.5 text-foreground">
                    <Link to="/rastreabilidade" search={{ qr: a.i.qrCode }} className="hover:underline">{a.p?.nome}</Link>
                  </td>
                  <td className="px-2 py-2.5 text-muted-foreground">{a.est.recomendado} {a.un}</td>
                  <td className="px-2 py-2.5 font-semibold text-foreground">{a.est.aplicado} {a.un}</td>
                  <td className="px-2 py-2.5"><EstouroBadge percentual={a.est.percentual} /></td>
                  <td className="px-2 py-2.5 whitespace-nowrap text-muted-foreground">{new Date(a.data).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
              {top5.length === 0 && <tr><td colSpan={7} className="px-2 py-6 text-center text-muted-foreground">Nenhuma aplicação no filtro.</td></tr>}
            </tbody>
          </table>
        </div>
      </Painel>
    </div>
  );
}

const inputCls = "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Kpi({ icon: Icon, titulo, valor, cor, pequeno }: { icon: typeof Gauge; titulo: string; valor: string; cor: string; pequeno?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card" style={{ borderTop: `4px solid ${cor}` }}>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Icon className="h-4 w-4" style={{ color: cor }} /> {titulo}</p>
      <p className={`mt-2 font-extrabold leading-tight text-foreground ${pequeno ? "text-xl sm:text-2xl" : "text-3xl sm:text-4xl"}`}>{valor}</p>
    </div>
  );
}

function Painel({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <h2 className="mb-3 text-sm font-bold text-foreground">{titulo}</h2>
      {children}
    </section>
  );
}

function Chip({ icon: Icon, v, k, alerta }: { icon: typeof Gauge; v: number; k: string; alerta?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${alerta ? "bg-destructive/12 text-destructive" : "bg-secondary text-secondary-foreground"}`}>
      <Icon className="h-3.5 w-3.5" /> <b>{v}</b> {k}
    </span>
  );
}
