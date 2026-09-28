import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useApp } from "@/lib/insum/store";

export const Route = createFileRoute("/fazendas")({
  head: () => ({
    meta: [
      { title: "Fazendas e talhões · Insumo Certo" },
      {
        name: "description",
        content: "Cadastro de fazendas e talhões com área, ordens de serviço vinculadas e insumos aplicados em cada unidade.",
      },
      { property: "og:title", content: "Fazendas e talhões · Insumo Certo" },
      { property: "og:description", content: "Área por talhão, ordens vinculadas e insumos aplicados." },
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
        <p className="mt-1 text-sm text-muted-foreground">Unidades, talhões e movimentação de insumos.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.fazendas.map((f) => {
          const insumos = data.insumos.filter((i) => i.fazendaId === f.id);
          const ordens = data.ordens.filter((o) => o.fazendaId === f.id);
          const area = f.talhoes.reduce((s, t) => s + t.areaHa, 0);
          return (
            <article key={f.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <MapPin className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-extrabold text-foreground">{f.nome}</h2>
                  <p className="truncate text-xs text-muted-foreground">
                    {f.municipio} · {area.toLocaleString("pt-BR")} ha
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Mini k="Talhões" v={f.talhoes.length} />
                <Mini k="OS" v={ordens.length} />
                <Mini k="Aplicados" v={insumos.filter((i) => i.status === "aplicado").length} />
              </div>

              <ul className="mt-4 divide-y divide-border">
                {f.talhoes.map((t) => (
                  <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{t.nome}</p>
                      <p className="text-xs text-muted-foreground">{t.areaHa} ha</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {data.insumos.filter((i) => i.talhaoId === t.id).length} insumos
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Mini({ k, v }: { k: string; v: number }) {
  return (
    <div className="rounded-xl bg-secondary px-2 py-3">
      <p className="text-xl font-extrabold text-secondary-foreground">{v}</p>
      <p className="text-[11px] text-muted-foreground">{k}</p>
    </div>
  );
}
