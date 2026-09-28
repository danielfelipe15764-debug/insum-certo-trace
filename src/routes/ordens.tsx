import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { StatusBadge } from "@/components/insum/StatusBadge";
import { useApp } from "@/lib/insum/store";

export const Route = createFileRoute("/ordens")({
  head: () => ({
    meta: [
      { title: "Ordens de Serviço · Insumo Certo" },
      {
        name: "description",
        content: "Consulte ordens de serviço com status, produtos vinculados, quantidades e progresso de aplicação.",
      },
      { property: "og:title", content: "Ordens de Serviço · Insumo Certo" },
      { property: "og:description", content: "Status, insumos vinculados e progresso de cada ordem de serviço." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ordens,
});

function Ordens() {
  const { data, produto, fazenda, talhaoNome } = useApp();
  const [filtro, setFiltro] = useState("todas");

  const ordens = data.ordens.filter((o) => filtro === "todas" || o.status === filtro);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-foreground">Ordens de Serviço</h1>
          <p className="mt-1 text-sm text-muted-foreground">Produtos vinculados e progresso de cada OS.</p>
        </div>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="todas">Todas</option>
          <option value="aberta">Abertas</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluida">Concluídas</option>
        </select>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {ordens.map((o) => {
          const itens = data.insumos.filter((i) => i.osId === o.id);
          const aplicados = itens.filter((i) => i.status === "aplicado").length;
          const pct = itens.length ? Math.round((aplicados / itens.length) * 100) : 0;
          return (
            <article key={o.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-extrabold text-foreground">{o.codigo}</p>
                  <p className="truncate text-sm text-muted-foreground">{o.descricao}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {fazenda(o.fazendaId)?.nome} · {talhaoNome(o.fazendaId, o.talhaoId)} ·{" "}
                    {new Date(o.dataProgramada + "T12:00:00").toLocaleDateString("pt-BR")} · {o.responsavel}
                  </p>
                </div>
                <StatusBadge status={o.status} />
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                  {aplicados}/{itens.length} aplicados
                </span>
              </div>

              <ul className="mt-4 divide-y divide-border">
                {itens.map((i) => (
                  <li key={i.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{produto(i.produtoId)?.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {i.qrCode} · lote {i.lote} · {i.quantidade} {produto(i.produtoId)?.unidade}
                      </p>
                    </div>
                    <StatusBadge status={i.status} />
                  </li>
                ))}
                {itens.length === 0 && <li className="py-3 text-sm text-muted-foreground">Nenhum insumo vinculado.</li>}
              </ul>

              <Link to="/rastreabilidade" search={{ qr: "" }} className="mt-3 inline-flex text-sm font-semibold text-primary">
                Abrir rastreabilidade
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
