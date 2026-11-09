import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bell, Droplets, Gauge, Satellite, Timer } from "lucide-react";
import { useApp } from "@/lib/insum/store";
import { alertaLabel, JANELA_ESTABILIZACAO_MIN, type TipoAlerta } from "@/lib/insum/calda";
import { maquinaNome } from "@/lib/insum/calda-seed";
import { fmtDataHora, fmtN, fmtPct, useCalda } from "@/lib/insum/use-calda";
import { AvisoDemo, ClasseBadge, DesvioTexto, Secao } from "@/components/insum/CaldaUi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/monitoramento")({
  head: () => ({
    meta: [
      { title: "Monitoramento de Aplicação · Insumo Certo" },
      { name: "description", content: "Monitoramento automático de calda: sensor de nível, hectares aplicados e desvio de consumo por ciclo." },
      { property: "og:title", content: "Monitoramento de Aplicação · Insumo Certo" },
      { property: "og:description", content: "Planejado x consumido em cada ciclo de abastecimento e aplicação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Monitoramento,
});

const passos = [
  { icon: Droplets, t: "Volume inicial", d: "Sensor registra o nível do tanque no início" },
  { icon: Satellite, t: "Hectares aplicados", d: "Área efetiva recebida do Solinftec" },
  { icon: Timer, t: `Estabilização ${JANELA_ESTABILIZACAO_MIN} min`, d: "Leituras consecutivas até o nível estabilizar" },
  { icon: Gauge, t: "Desvio calculado", d: "Consumo real × esperado para a área" },
];

function Monitoramento() {
  const { data, talhaoNome } = useApp();
  const { linhas, alertas, tolerancias, salvarTolerancias } = useCalda();
  const [sel, setSel] = useState(linhas[linhas.length - 5]!.c.id);
  const [tipoAlerta, setTipoAlerta] = useState<TipoAlerta | "">("");
  const [rascunho, setRascunho] = useState<Record<string, string>>({});
  const fazNome = (id: string) => data.fazendas.find((f) => f.id === id)?.nome ?? id;
  const atual = linhas.find((l) => l.c.id === sel)!;
  const ordenadas = useMemo(() => [...linhas].reverse(), [linhas]);
  const { c, r } = atual;
  const somaAb = c.abastecimentos.reduce((s, a) => s + a.volumeL, 0);
  const somaDev = c.devolucoes.reduce((s, a) => s + a.volumeL, 0);
  const serie = c.leituras.map((l, k) => ({ t: `${(k + 1) * 25}s`, v: l.volumeL }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Monitoramento de Aplicação</h1>
        <p className="text-sm text-muted-foreground">Calda e produtos líquidos · ciclo a ciclo, sem digitação do operador</p>
      </div>
      <AvisoDemo />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {passos.map(({ icon: Icon, t, d }, i) => (
          <div key={t} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
              <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
            </div>
            <p className="mt-2 text-sm font-bold text-foreground">{t}</p>
            <p className="text-xs text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>

      <Secao
        titulo="Ciclo selecionado"
        acao={
          <select value={sel} onChange={(e) => setSel(e.target.value)} className="h-10 max-w-full rounded-lg border border-input bg-background px-3 text-sm">
            {ordenadas.map(({ c }) => (
              <option key={c.id} value={c.id}>{c.id.toUpperCase()} · {maquinaNome(c.maquinaId)} · {fmtDataHora(c.inicio)}</option>
            ))}
          </select>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <ClasseBadge classe={r.classe} />
              <span className="text-xs text-muted-foreground">{c.operacao} · {c.produto} ({c.concentracao}) · tolerância ±{atual.tol}%</span>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {[
                ["Máquina", maquinaNome(c.maquinaId)], ["Operador", c.operador], ["Fazenda", fazNome(c.fazendaId)],
                ["Talhão", talhaoNome(c.fazendaId, c.talhaoId)], ["OS", c.osCodigo], ["Sensor", c.sensorId],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2 border-b border-border/60 py-1"><dt className="text-muted-foreground">{k}</dt><dd className="truncate font-medium">{v}</dd></div>
              ))}
            </dl>
            <div className="rounded-xl bg-muted/60 p-3 font-mono text-xs leading-6 text-foreground">
              <p>Consumo = inicial + abastecimentos − residual − devoluções</p>
              <p>= {fmtN(c.volumeInicialL)} + {fmtN(somaAb)} − {c.volumeResidualL === undefined ? "?" : fmtN(c.volumeResidualL, 1)} − {fmtN(somaDev)} = <strong>{fmtN(r.consumoRealL)} L</strong></p>
              <p>Esperado = {fmtN(c.hectares, 1)} ha × {c.vazaoPlanejadaLha} L/ha = <strong>{fmtN(r.consumoEsperadoL)} L</strong></p>
              <p>Vazão real = {fmtN(r.vazaoRealLha, 1)} L/ha · Desvio = <strong>{r.classe === "pendente" || r.classe === "inconsistente" ? "—" : fmtPct(r.desvioPct)}</strong></p>
              {r.motivo && <p className="text-destructive">{r.motivo}</p>}
            </div>
            {c.abastecimentos.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {c.abastecimentos.length} abastecimento(s) intermediário(s): {c.abastecimentos.map((a) => `${fmtN(a.volumeL)} L`).join(", ")}
                {somaDev > 0 && ` · devolução de ${fmtN(somaDev)} L`}
              </p>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Leituras do sensor na janela de estabilização (L)</p>
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={serie}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="t" fontSize={11} />
                  <YAxis fontSize={11} width={40} />
                  <Tooltip />
                  {c.volumeResidualL !== undefined && <ReferenceLine y={c.volumeResidualL} stroke="var(--success)" strokeDasharray="4 4" />}
                  <Line dataKey="v" stroke="var(--primary)" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">
              {c.volumeResidualL !== undefined ? `Residual registrado automaticamente: ${fmtN(c.volumeResidualL, 1)} L` : "Sem leitura estável — residual não registrado"}
            </p>
          </div>
        </div>
      </Secao>

      <Tabs defaultValue="ciclos">
        <TabsList>
          <TabsTrigger value="ciclos">Ciclos ({linhas.length})</TabsTrigger>
          <TabsTrigger value="alertas">Alertas ({alertas.length})</TabsTrigger>
          <TabsTrigger value="tolerancias">Tolerâncias</TabsTrigger>
        </TabsList>

        <TabsContent value="ciclos">
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
            <table className="w-full min-w-[1400px] whitespace-nowrap text-sm">
              <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                <tr>{["Ciclo", "Data", "Máquina", "Operador", "Fazenda / Talhão", "OS", "Operação / Produto", "Inicial", "+Abast.", "Residual", "Consumido", "ha", "Vazão plan.", "Vazão real", "Desvio", "Sensor / Status"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody>
                {ordenadas.map(({ c, r, tol }) => (
                  <tr key={c.id} onClick={() => setSel(c.id)} className="cursor-pointer border-t border-border hover:bg-muted/40">
                    <td className="px-3 py-2 font-mono text-xs">{c.id.toUpperCase()}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{fmtDataHora(c.inicio)}</td>
                    <td className="px-3 py-2">{maquinaNome(c.maquinaId)}</td>
                    <td className="px-3 py-2">{c.operador}</td>
                    <td className="px-3 py-2">{fazNome(c.fazendaId)} · {talhaoNome(c.fazendaId, c.talhaoId)}</td>
                    <td className="px-3 py-2">{c.osCodigo}</td>
                    <td className="px-3 py-2">{c.operacao}<br /><span className="text-xs text-muted-foreground">{c.produto}</span></td>
                    <td className="px-3 py-2 tabular-nums">{fmtN(c.volumeInicialL)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtN(c.abastecimentos.reduce((s, a) => s + a.volumeL, 0))}</td>
                    <td className="px-3 py-2 tabular-nums">{c.volumeResidualL === undefined ? "—" : fmtN(c.volumeResidualL, 1)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtN(r.consumoRealL)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtN(c.hectares, 1)}</td>
                    <td className="px-3 py-2 tabular-nums">{c.vazaoPlanejadaLha}</td>
                    <td className="px-3 py-2 tabular-nums">{r.vazaoRealLha ? fmtN(r.vazaoRealLha, 1) : "—"}</td>
                    <td className="px-3 py-2">{r.consumoRealL && r.consumoEsperadoL && r.classe !== "inconsistente" ? <DesvioTexto pct={r.desvioPct} tol={tol} /> : "—"}</td>
                    <td className="px-3 py-2"><span className="block font-mono text-[11px] text-muted-foreground">{c.sensorId}</span><ClasseBadge classe={r.classe} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="alertas">
          <Secao
            titulo="Histórico de alertas"
            acao={
              <select value={tipoAlerta} onChange={(e) => setTipoAlerta(e.target.value as TipoAlerta | "")} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
                <option value="">Todos os tipos</option>
                {Object.entries(alertaLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            }
          >
            <ul className="divide-y divide-border">
              {alertas.filter((a) => !tipoAlerta || a.tipo === tipoAlerta).map((a) => {
                const l = linhas.find((x) => x.c.id === a.cicloId)!;
                return (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                    <Bell className={a.tipo === "acima" || a.tipo === "residual_inconsistente" ? "h-4 w-4 text-destructive" : "h-4 w-4 text-warning"} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{alertaLabel[a.tipo]} <span className="font-normal text-muted-foreground">· {a.mensagem}</span></p>
                      <p className="text-xs text-muted-foreground">
                        Origem: {a.cicloId.toUpperCase()} · {maquinaNome(l.c.maquinaId)} · {l.c.operador} · {fazNome(l.c.fazendaId)} · {l.c.osCodigo} · {fmtDataHora(a.dataHora)}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { setSel(a.cicloId); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Ver ciclo</Button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Desvio identificado não é, por si só, desperdício — está sujeito à análise operacional.</p>
          </Secao>
        </TabsContent>

        <TabsContent value="tolerancias">
          <Secao titulo="Tolerância por operação (±%)">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(tolerancias).map(([k, v]) => (
                <label key={k} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
                  <span className="font-medium">{k}</span>
                  <Input type="number" min={0} step={0.5} className="w-24" value={rascunho[k] ?? String(v)} onChange={(e) => setRascunho({ ...rascunho, [k]: e.target.value })} />
                </label>
              ))}
            </div>
            <Button className="mt-4" onClick={() => {
              const t = { ...tolerancias };
              Object.entries(rascunho).forEach(([k, v]) => { const n = Number(v); if (Number.isFinite(n) && n >= 0) t[k] = n; });
              salvarTolerancias(t); setRascunho({}); toast.success("Tolerâncias salvas");
            }}>Salvar tolerâncias</Button>
            <p className="mt-2 text-xs text-muted-foreground">Também aceita regra por produto ou recomendação técnica (chave “operação|produto”), que tem prioridade sobre a da operação.</p>
          </Secao>
        </TabsContent>
      </Tabs>
    </div>
  );
}
