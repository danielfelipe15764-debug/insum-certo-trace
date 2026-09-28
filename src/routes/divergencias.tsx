import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/insum/StatusBadge";
import { divergenciaLabel, fmtDataHora, useApp } from "@/lib/insum/store";

export const Route = createFileRoute("/divergencias")({
  head: () => ({
    meta: [
      { title: "Central de Divergências · Insumo Certo" },
      {
        name: "description",
        content:
          "Central de divergências: produto aplicado em fazenda diferente, insumo não aplicado, quantidade divergente e QR Code duplicado.",
      },
      { property: "og:title", content: "Central de Divergências · Insumo Certo" },
      { property: "og:description", content: "Alertas automáticos de inconsistências no fluxo dos insumos." },
    ],
  }),
  component: Divergencias,
});

function Divergencias() {
  const { data, produto, fazenda, ordem, resolverDivergencia } = useApp();
  const [aba, setAba] = useState<"abertas" | "resolvidas">("abertas");

  const lista = data.divergencias
    .filter((d) => (aba === "abertas" ? !d.resolvida : d.resolvida))
    .sort((a, b) => b.dataHora.localeCompare(a.dataHora));

  const tipos = (["fazenda_divergente", "quantidade_divergente", "nao_aplicado", "qr_duplicado", "os_divergente"] as const).map(
    (t) => ({ t, n: data.divergencias.filter((d) => d.tipo === t && !d.resolvida).length }),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Central de Divergências</h1>
        <p className="mt-1 text-sm text-muted-foreground">Inconsistências detectadas automaticamente nas leituras de QR Code.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {tipos.map(({ t, n }) => (
          <div key={t} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <p className="text-xs font-medium text-muted-foreground">{divergenciaLabel[t]}</p>
            <p className="mt-1 text-2xl font-extrabold text-foreground">{n}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(["abertas", "resolvidas"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold capitalize ${
              aba === a ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {lista.map((d) => {
          const ins = data.insumos.find((i) => i.id === d.insumoId);
          return (
            <article key={d.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={d.severidade} label={divergenciaLabel[d.tipo] ?? d.tipo} />
                    <span className="text-xs text-muted-foreground">{fmtDataHora(d.dataHora)}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">{d.descricao}</p>
                  {ins && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {ins.qrCode} · {produto(ins.produtoId)?.nome} · {ordem(ins.osId)?.codigo} · {fazenda(ins.fazendaId)?.nome}
                    </p>
                  )}
                </div>
                {d.resolvida ? (
                  <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-success">
                    <CheckCircle2 className="h-4 w-4" /> Resolvida
                  </span>
                ) : (
                  <button
                    onClick={() => resolverDivergencia(d.id)}
                    className="shrink-0 rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground"
                  >
                    Marcar resolvida
                  </button>
                )}
              </div>
            </article>
          );
        })}
        {lista.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
            <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Nenhuma divergência nesta aba.</p>
          </div>
        )}
      </div>
    </div>
  );
}
