import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Droplets, Gauge, Map as MapIcon, Tractor, TrendingUp } from "lucide-react";
import { useApp } from "@/lib/insum/store";
import { corCalor, desvioPonderado, faixaCalor, TOLERANCIA_PADRAO } from "@/lib/insum/calda";
import { maquinaNome, maquinas } from "@/lib/insum/calda-seed";
import { agrupar, fmtN, fmtPct, mesDe, useCalda, valida, type Agregado } from "@/lib/insum/use-calda";
import { AvisoDemo, DesvioTexto, Kpi, Secao } from "@/components/insum/CaldaUi";
import { SatMap } from "@/components/insum/SatMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/eficiencia")({
  head: () => ({
    meta: [
      { title: "Ranking de Eficiência · Insumo Certo" },
      { name: "description", content: "Inteligência de consumo: planejado x real, rankings por máquina, operador, fazenda e operação e mapa de calor de desvios." },
      { property: "og:title", content: "Ranking de Eficiência · Insumo Certo" },
      { property: "og:description", content: "Onde o consumo de calda foge do planejado e quanto poderia ser economizado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Eficiencia,
});

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const sel = "h-10 rounded-lg border border-input bg-background px-3 text-sm";

function Eficiencia() {
  const { data, talhaoNome } = useApp();
  const { linhas } = useCalda();
  const fazNome = (id: string) => data.fazendas.find((f) => f.id === id)?.nome ?? id;
  const [f, setF] = useState({ safra: "", de: "", ate: "", fazenda: "", maquina: "", operador: "", operacao: "", produto: "" });
  const [fazSel, setFazSel] = useState("");
  const opts = (k: (l: (typeof linhas)[number]) => string) => [...new Set(linhas.map(k))].sort();

  const filtradas = useMemo(
    () =>
      linhas.filter(({ c }) => {
        const d = c.inicio.slice(0, 10);
        return (!f.safra || c.safra === f.safra) && (!f.de || d >= f.de) && (!f.ate || d <= f.ate) && (!f.fazenda || c.fazendaId === f.fazenda) &&
          (!f.maquina || c.maquinaId === f.maquina) && (!f.operador || c.operador === f.operador) && (!f.operacao || c.operacao === f.operacao) && (!f.produto || c.produto === f.produto);
      }),
    [linhas, f],
  );
  const ok = filtradas.filter(valida);
  const ha = ok.reduce((s, l) => s + l.c.hectares, 0);
  const plan = ok.reduce((s, l) => s + l.r.consumoEsperadoL, 0);
  const real = ok.reduce((s, l) => s + l.r.consumoRealL, 0);
  const excedente = ok.reduce((s, l) => s + Math.max(0, l.r.desvioL), 0);
  const fora = ok.filter((l) => l.r.classe !== "dentro").length;
  const pend = filtradas.length - ok.length;

  const porMaq = agrupar(filtradas, (l) => l.c.maquinaId);
  const porOp = agrupar(filtradas, (l) => l.c.operador, (l) => maquinaNome(l.c.maquinaId));
  const porFaz = agrupar(filtradas, (l) => l.c.fazendaId);
  const porOper = agrupar(filtradas, (l) => l.c.operacao);
  const porTalhao = agrupar(filtradas, (l) => `${l.c.fazendaId}|${l.c.talhaoId}`);

  const mensal = useMemo(() => {
    const m = new Map<string, typeof ok>();
    ok.forEach((l) => m.set(mesDe(l.c.inicio), [...(m.get(mesDe(l.c.inicio)) ?? []), l]));
    return [...m.entries()].sort().map(([k, ls]) => ({
      mes: `${MESES[Number(k.slice(5)) - 1]}/${k.slice(2, 4)}`,
      planejado: Math.round(ls.reduce((s, l) => s + l.r.consumoEsperadoL, 0)),
      real: Math.round(ls.reduce((s, l) => s + l.r.consumoRealL, 0)),
      desvio: Number(desvioPonderado(ls.map((l) => l.r)).toFixed(1)),
    }));
  }, [ok]);

  const barras = (ag: Agregado[], nome: (k: string) => string) => ag.map((a) => ({ nome: nome(a.chave), pct: Number(a.pct.toFixed(1)) }));
  const fazendaFoco = fazSel || porFaz[0]?.chave || "";
  const fz = data.fazendas.find((x) => x.id === fazendaFoco);
  const talhoesFoco = porTalhao.filter((t) => t.chave.startsWith(`${fazendaFoco}|`));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Ranking de Eficiência</h1>
        <p className="text-sm text-muted-foreground">Inteligência de consumo · planejado × real, ponderado pelo volume planejado</p>
      </div>
      <AvisoDemo />

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-3 shadow-card md:grid-cols-4 xl:grid-cols-8">
        <select className={sel} value={f.safra} onChange={(e) => setF({ ...f, safra: e.target.value })}><option value="">Todas as safras</option>{opts((l) => l.c.safra).map((s) => <option key={s}>{s}</option>)}</select>
        <input type="date" aria-label="De" className={sel} value={f.de} onChange={(e) => setF({ ...f, de: e.target.value })} />
        <input type="date" aria-label="Até" className={sel} value={f.ate} onChange={(e) => setF({ ...f, ate: e.target.value })} />
        <select className={sel} value={f.fazenda} onChange={(e) => setF({ ...f, fazenda: e.target.value })}><option value="">Todas as fazendas</option>{data.fazendas.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}</select>
        <select className={sel} value={f.maquina} onChange={(e) => setF({ ...f, maquina: e.target.value })}><option value="">Todas as máquinas</option>{maquinas.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</select>
        <select className={sel} value={f.operador} onChange={(e) => setF({ ...f, operador: e.target.value })}><option value="">Todos operadores</option>{opts((l) => l.c.operador).map((s) => <option key={s}>{s}</option>)}</select>
        <select className={sel} value={f.operacao} onChange={(e) => setF({ ...f, operacao: e.target.value })}><option value="">Todas operações</option>{opts((l) => l.c.operacao).map((s) => <option key={s}>{s}</option>)}</select>
        <select className={sel} value={f.produto} onChange={(e) => setF({ ...f, produto: e.target.value })}><option value="">Todos produtos</option>{opts((l) => l.c.produto).map((s) => <option key={s}>{s}</option>)}</select>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi titulo="Hectares monitorados" valor={fmtN(ha)} sub={`${ok.length} aplicações válidas`} icon={<MapIcon className="h-4 w-4" />} />
        <Kpi titulo="Litros planejados" valor={fmtN(plan)} icon={<Droplets className="h-4 w-4" />} />
        <Kpi titulo="Litros consumidos" valor={fmtN(real)} icon={<Droplets className="h-4 w-4 text-primary" />} />
        <Kpi titulo="Litros excedentes" valor={<span className="text-destructive">{fmtN(excedente)}</span>} sub="Potencial de economia se os desvios fossem zerados" icon={<TrendingUp className="h-4 w-4" />} />
        <Kpi titulo="Desvio médio ponderado" valor={<DesvioTexto pct={desvioPonderado(ok.map((l) => l.r))} tol={TOLERANCIA_PADRAO} />} icon={<Gauge className="h-4 w-4" />} />
        <Kpi titulo="Fora da tolerância" valor={fora} sub={`${pend} leitura(s) pendente(s)/inconsistente(s)`} icon={<AlertTriangle className="h-4 w-4" />} />
        <Kpi titulo="Máquinas monitoradas" valor={new Set(filtradas.map((l) => l.c.maquinaId)).size} icon={<Tractor className="h-4 w-4" />} />
        <Kpi titulo="Operação com maior desvio" valor={<span className="text-base">{porOper[0]?.chave ?? "—"}</span>} sub={porOper[0] ? fmtPct(porOper[0].pct) : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Secao titulo="Consumo planejado × real (L)">
          <div className="h-64"><ResponsiveContainer><BarChart data={mensal}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="mes" fontSize={11} /><YAxis fontSize={11} width={55} /><Tooltip /><Legend /><Bar dataKey="planejado" name="Planejado" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} /><Bar dataKey="real" name="Real" fill="var(--primary)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Secao>
        <Secao titulo="Evolução do desvio ponderado (%)">
          <div className="h-64"><ResponsiveContainer><LineChart data={mensal}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="mes" fontSize={11} /><YAxis fontSize={11} width={40} /><Tooltip /><ReferenceLine y={0} stroke="var(--border)" /><Line dataKey="desvio" name="Desvio %" stroke="var(--destructive)" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
        </Secao>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {[
          { t: "Máquinas com maiores desvios", d: barras(porMaq, maquinaNome) },
          { t: "Operadores", d: barras(porOp, (k) => k) },
          { t: "Fazendas", d: barras(porFaz, fazNome) },
          { t: "Comparação entre operações", d: barras(porOper, (k) => k.replace("Aplicação ", "")) },
        ].map(({ t, d }) => (
          <Secao key={t} titulo={`${t} (%)`}>
            <div style={{ height: Math.max(160, d.length * 40) }}>
              <ResponsiveContainer>
                <BarChart data={d} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" fontSize={11} />
                  <YAxis type="category" dataKey="nome" width={150} fontSize={11} />
                  <Tooltip />
                  <ReferenceLine x={0} stroke="var(--muted-foreground)" />
                  <Bar dataKey="pct" name="Desvio %" radius={4}>{d.map((x) => <Cell key={x.nome} fill={corCalor[faixaCalor(x.pct)]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Secao>
        ))}
      </div>

      <Secao titulo="Rankings detalhados">
        <Tabs defaultValue="maquina">
          <TabsList className="flex-wrap">
            <TabsTrigger value="maquina">Por máquina</TabsTrigger>
            <TabsTrigger value="operador">Por operador</TabsTrigger>
            <TabsTrigger value="fazenda">Por fazenda</TabsTrigger>
            <TabsTrigger value="operacao">Por operação</TabsTrigger>
          </TabsList>
          <TabsContent value="maquina"><Ranking linhas={porMaq} cols={["Máquina", "Aplicações", "Área (ha)", "Esperado (L)", "Real (L)", "Desvio (L)", "Desvio %"]} cel={(a) => [maquinaNome(a.chave), a.n, fmtN(a.ha, 1), fmtN(a.esperado), fmtN(a.real), fmtN(a.desvioL)]} /></TabsContent>
          <TabsContent value="operador">
            <p className="mb-2 rounded-lg bg-primary/5 p-2 text-xs text-muted-foreground">Ferramenta para identificar oportunidades de orientação e treinamento — não um instrumento isolado de punição. Considere máquina, condições de campo e tipo de operação.</p>
            <Ranking linhas={porOp} cols={["Operador", "Máquinas", "Operações", "Hectares", "Esperado (L)", "Real (L)", "Desvio %"]} cel={(a) => [a.chave, [...a.extra].join(", "), a.n, fmtN(a.ha, 1), fmtN(a.esperado), fmtN(a.real)]} />
          </TabsContent>
          <TabsContent value="fazenda"><Ranking linhas={porFaz} cols={["Fazenda", "Área (ha)", "Operações", "Esperado (L)", "Real (L)", "Excedente / economia (L)", "Desvio %"]} cel={(a) => [fazNome(a.chave), fmtN(a.ha, 1), a.n, fmtN(a.esperado), fmtN(a.real), `${a.desvioL > 0 ? "+" : ""}${fmtN(a.desvioL)}`]} onClick={(a) => setFazSel(a.chave)} /></TabsContent>
          <TabsContent value="operacao"><Ranking linhas={porOper} cols={["Operação", "Aplicações", "Área (ha)", "Vazão plan. (L/ha)", "Vazão real (L/ha)", "Esperado (L)", "Real (L)", "Desvio %"]} cel={(a) => [a.chave, a.n, fmtN(a.ha, 1), fmtN(a.vazaoPlan, 1), fmtN(a.vazaoReal, 1), fmtN(a.esperado), fmtN(a.real)]} /></TabsContent>
        </Tabs>
        <p className="mt-3 text-xs text-muted-foreground">Percentuais ponderados pelo consumo planejado; cada ciclo é comparado com a vazão do próprio produto e concentração. Desvio identificado está sujeito à análise operacional.</p>
      </Secao>

      <Secao
        titulo="Mapa de calor de desvios"
        acao={<select className={sel} value={fazendaFoco} onChange={(e) => setFazSel(e.target.value)}>{data.fazendas.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}</select>}
      >
        <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {data.fazendas.map((x) => {
            const a = porFaz.find((p) => p.chave === x.id);
            return (
              <button key={x.id} onClick={() => setFazSel(x.id)} className={`rounded-xl border-2 p-3 text-left ${x.id === fazendaFoco ? "border-primary" : "border-border"}`}>
                <span className="mb-1 block h-2 w-full rounded-full" style={{ background: a ? corCalor[faixaCalor(a.pct)] : "var(--muted)" }} />
                <span className="block truncate text-sm font-bold">{x.nome}</span>
                <span className="text-xs text-muted-foreground">{a ? `${fmtPct(a.pct)} · ${fmtN(a.ha)} ha` : "Sem dados"}</span>
              </button>
            );
          })}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {fz && (
            <SatMap
              altura={360}
              pins={[]}
              poligonos={fz.talhoes.map((t) => {
                const a = talhoesFoco.find((x) => x.chave.endsWith(`|${t.id}`));
                return { id: t.id, pontos: t.poligono, nome: `${t.nome} ${a ? fmtPct(a.pct) : ""}`, cor: a ? corCalor[faixaCalor(a.pct)] : "#94a3b8" };
              })}
            />
          )}
          <table className="h-fit w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Talhão</th><th>ha aplicados</th><th>Ops.</th><th>Desvio</th></tr></thead>
            <tbody>
              {talhoesFoco.map((t) => {
                const [fid, tid] = t.chave.split("|") as [string, string];
                return (
                  <tr key={t.chave} className="border-t border-border">
                    <td className="py-2"><span className="mr-2 inline-block h-3 w-3 rounded-full align-middle" style={{ background: corCalor[faixaCalor(t.pct)] }} />{talhaoNome(fid, tid)}</td>
                    <td className="tabular-nums">{fmtN(t.ha, 1)}</td><td>{t.n}</td><td><DesvioTexto pct={t.pct} tol={TOLERANCIA_PADRAO} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span><span className="mr-1 inline-block h-3 w-3 rounded-full align-middle" style={{ background: corCalor.verde }} />Dentro da tolerância (±{TOLERANCIA_PADRAO}%)</span>
          <span><span className="mr-1 inline-block h-3 w-3 rounded-full align-middle" style={{ background: corCalor.amarelo }} />Atenção (até ±{TOLERANCIA_PADRAO * 2}%)</span>
          <span><span className="mr-1 inline-block h-3 w-3 rounded-full align-middle" style={{ background: corCalor.vermelho }} />Desvio elevado</span>
        </div>
      </Secao>
    </div>
  );
}

function Ranking({ linhas, cols, cel, onClick }: { linhas: Agregado[]; cols: string[]; cel: (a: Agregado) => (string | number)[]; onClick?: (a: Agregado) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2 pr-2">#</th>{cols.map((c) => <th key={c} className="py-2 pr-3">{c}</th>)}</tr></thead>
        <tbody>
          {linhas.map((a, i) => (
            <tr key={a.chave} onClick={() => onClick?.(a)} className={`border-t border-border ${onClick ? "cursor-pointer hover:bg-muted/40" : ""}`}>
              <td className="py-2 pr-2 font-bold text-muted-foreground">{i + 1}</td>
              {cel(a).map((v, k) => <td key={k} className="py-2 pr-3 tabular-nums">{v}</td>)}
              <td className="py-2"><DesvioTexto pct={a.pct} tol={TOLERANCIA_PADRAO} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
