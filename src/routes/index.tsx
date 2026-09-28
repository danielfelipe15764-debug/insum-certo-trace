import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, CheckCircle2, Clock, PackageCheck, Truck, QrCode } from "lucide-react";
import { fmtDataHora, useApp } from "@/lib/insum/store";
import { StatusBadge } from "@/components/insum/StatusBadge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel de controle · Insumo Certo" },
      {
        name: "description",
        content:
          "Painel com indicadores de insumos agrícolas em transporte, entregues, aplicados, pendentes e divergências por fazenda e produto.",
      },
      { property: "og:title", content: "Painel de controle · Insumo Certo" },
      {
        property: "og:description",
        content: "Rastreabilidade total do insumo agrícola do almoxarifado até a aplicação no talhão.",
      },
    ],
  }),
  component: Dashboard,
});

const CORES = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Kpi({
  icone: Icone,
  titulo,
  valor,
  cor,
}: {
  icone: typeof Truck;
  titulo: string;
  valor: number;
  cor: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${cor} 15%, transparent)`, color: cor }}>
          <Icone className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{titulo}</p>
          <p className="text-2xl font-extrabold leading-tight text-foreground">{valor}</p>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { data, produto, fazenda, ordem, talhaoNome } = useApp();

  const conta = (s: string) => data.insumos.filter((i) => i.status === s).length;
  const divAbertas = data.divergencias.filter((d) => !d.resolvida);

  const porFazenda = data.fazendas.map((f) => {
    const list = data.insumos.filter((i) => i.fazendaId === f.id);
    return {
      nome: f.nome.replace("Fazenda ", ""),
      Transporte: list.filter((i) => i.status === "em_transporte").length,
      Entregue: list.filter((i) => i.status === "entregue").length,
      Aplicado: list.filter((i) => i.status === "aplicado").length,
      Pendente: list.filter((i) => i.status === "pendente").length,
    };
  });

  const porProduto = data.produtos
    .map((p) => ({ name: p.nome.split(" ")[0], value: data.insumos.filter((i) => i.produtoId === p.id).length }))
    .filter((x) => x.value > 0);

  const ultimos = [...data.eventos].sort((a, b) => b.dataHora.localeCompare(a.dataHora)).slice(0, 8);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-card lg:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Painel operacional</p>
        <h1 className="mt-1 text-2xl font-extrabold lg:text-3xl">Rastreabilidade total dos seus insumos</h1>
        <p className="mt-2 max-w-2xl text-sm opacity-90">
          Cada produto possui um QR Code único. Leia na saída, na chegada e na aplicação — o histórico fica
          permanente e consultável.
        </p>
        <Link
          to="/ler-qr"
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-card px-5 py-3.5 text-base font-bold text-primary shadow-card"
        >
          <QrCode className="h-5 w-5" /> Ler QR Code agora
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi icone={Truck} titulo="Em transporte" valor={conta("em_transporte")} cor="var(--info)" />
        <Kpi icone={PackageCheck} titulo="Entregues" valor={conta("entregue")} cor="var(--warning)" />
        <Kpi icone={CheckCircle2} titulo="Aplicados" valor={conta("aplicado")} cor="var(--success)" />
        <Kpi icone={Clock} titulo="Pendentes" valor={conta("pendente")} cor="var(--muted-foreground)" />
        <Kpi icone={AlertTriangle} titulo="Divergências" valor={divAbertas.length} cor="var(--destructive)" />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card xl:col-span-2">
          <h2 className="text-sm font-bold text-foreground">Insumos por fazenda</h2>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porFazenda} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Pendente" stackId="a" fill="var(--muted-foreground)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Transporte" stackId="a" fill="var(--chart-4)" />
                <Bar dataKey="Entregue" stackId="a" fill="var(--chart-3)" />
                <Bar dataKey="Aplicado" stackId="a" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <h2 className="text-sm font-bold text-foreground">Volume de QR Codes por produto</h2>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={porProduto} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {porProduto.map((_, i) => (
                    <Cell key={i} fill={CORES[i % CORES.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-foreground">Últimas leituras</h2>
            <Link to="/rastreabilidade" search={{ qr: "" }} className="shrink-0 text-xs font-semibold text-primary">
              Ver rastreabilidade
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {ultimos.map((e) => {
              const ins = data.insumos.find((i) => i.id === e.insumoId);
              const p = ins ? produto(ins.produtoId) : undefined;
              return (
                <li key={e.id} className="flex items-start gap-3 py-3">
                  <StatusBadge
                    status={e.tipo === "aplicacao" ? "aplicado" : e.tipo === "chegada" ? "entregue" : e.tipo === "saida" ? "em_transporte" : "pendente"}
                    label={
                      e.tipo === "aplicacao" ? "Aplicação" : e.tipo === "chegada" ? "Chegada" : e.tipo === "saida" ? "Saída" : "Cadastro"
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {ins?.qrCode} · {p?.nome}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {e.local} · {e.responsavel} · {fmtDataHora(e.dataHora)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-foreground">Divergências abertas</h2>
            <Link to="/divergencias" className="shrink-0 text-xs font-semibold text-primary">
              Central
            </Link>
          </div>
          {divAbertas.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nenhuma divergência em aberto.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {divAbertas.slice(0, 5).map((d) => (
                <li key={d.id} className="rounded-xl bg-destructive/8 p-3">
                  <StatusBadge status={d.severidade} label={d.severidade.toUpperCase()} />
                  <p className="mt-2 text-xs text-foreground">{d.descricao}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <h2 className="text-sm font-bold text-foreground">Ordens de serviço em andamento</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-4">OS</th>
                <th className="py-2 pr-4">Fazenda / Talhão</th>
                <th className="py-2 pr-4">Responsável</th>
                <th className="py-2 pr-4">Progresso</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.ordens.map((o) => {
                const itens = data.insumos.filter((i) => i.osId === o.id);
                const aplicados = itens.filter((i) => i.status === "aplicado").length;
                const pct = itens.length ? Math.round((aplicados / itens.length) * 100) : 0;
                return (
                  <tr key={o.id}>
                    <td className="py-3 pr-4 font-semibold text-foreground">{o.codigo}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {fazenda(o.fazendaId)?.nome} · {talhaoNome(o.fazendaId, o.talhaoId)}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{o.responsavel}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={ordem(o.id)?.status ?? o.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
