import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, QrCode } from "lucide-react";
import { StatusBadge } from "@/components/insum/StatusBadge";
import { useApp } from "@/lib/insum/store";
import { exportarCsv } from "@/lib/insum/export";

export const Route = createFileRoute("/insumos")({
  head: () => ({
    meta: [
      { title: "Insumos e QR Codes · Insumo Certo" },
      {
        name: "description",
        content: "Lista de insumos agrícolas com QR Code único, lote, quantidade, ordem de serviço, fazenda e status atual.",
      },
      { property: "og:title", content: "Insumos e QR Codes · Insumo Certo" },
      { property: "og:description", content: "Cada produto com QR Code único, lote e status de rastreamento." },
    ],
  }),
  component: Insumos,
});

function Insumos() {
  const { data, produto, fazenda, ordem, talhaoNome } = useApp();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");

  const lista = data.insumos.filter((i) => {
    const t = busca.toLowerCase();
    const okBusca =
      !t || i.qrCode.toLowerCase().includes(t) || produto(i.produtoId)?.nome.toLowerCase().includes(t) || i.lote.toLowerCase().includes(t);
    return okBusca && (status === "todos" || i.status === status);
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-foreground">Insumos</h1>
          <p className="mt-1 text-sm text-muted-foreground">{data.insumos.length} QR Codes gerados no almoxarifado.</p>
        </div>
        <button
          onClick={() =>
            exportarCsv(
              "insumcerto-insumos",
              ["QR Code", "Produto", "Lote", "Quantidade", "Unidade", "OS", "Fazenda", "Talhão", "Status"],
              lista.map((i) => [
                i.qrCode,
                produto(i.produtoId)?.nome ?? "",
                i.lote,
                i.quantidade,
                produto(i.produtoId)?.unidade ?? "",
                ordem(i.osId)?.codigo ?? "",
                fazenda(i.fazendaId)?.nome ?? "",
                talhaoNome(i.fazendaId, i.talhaoId),
                i.status,
              ]),
            )
          }
          className="h-11 shrink-0 rounded-xl bg-secondary px-4 text-sm font-semibold text-secondary-foreground"
        >
          Exportar Excel
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por QR Code, produto ou lote"
            maxLength={40}
            className="h-11 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="todos">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="em_transporte">Em transporte</option>
          <option value="entregue">Entregues</option>
          <option value="aplicado">Aplicados</option>
        </select>
      </div>

      {/* Cartões no celular */}
      <div className="grid gap-3 lg:hidden">
        {lista.map((i) => (
          <div key={i.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-xs font-bold text-primary">
                  <QrCode className="h-3.5 w-3.5 shrink-0" /> {i.qrCode}
                </p>
                <p className="truncate text-base font-bold text-foreground">{produto(i.produtoId)?.nome}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Lote {i.lote} · {i.quantidade} {produto(i.produtoId)?.unidade}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {ordem(i.osId)?.codigo} · {fazenda(i.fazendaId)?.nome}
                </p>
              </div>
              <StatusBadge status={i.status} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabela no desktop */}
      <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card shadow-card lg:block">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-secondary/60">
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">QR Code</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Lote</th>
              <th className="px-4 py-3">Qtd.</th>
              <th className="px-4 py-3">OS</th>
              <th className="px-4 py-3">Fazenda / Talhão</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lista.map((i) => (
              <tr key={i.id}>
                <td className="px-4 py-3 font-semibold text-foreground">{i.qrCode}</td>
                <td className="px-4 py-3 text-foreground">{produto(i.produtoId)?.nome}</td>
                <td className="px-4 py-3 text-muted-foreground">{i.lote}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {i.quantidade} {produto(i.produtoId)?.unidade}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{ordem(i.osId)?.codigo}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {fazenda(i.fazendaId)?.nome} · {talhaoNome(i.fazendaId, i.talhaoId)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={i.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
