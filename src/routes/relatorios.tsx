import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { StatusBadge } from "@/components/insum/StatusBadge";
import { fmtDataHora, statusLabel, useApp } from "@/lib/insum/store";
import { exportarCsv, exportarPdf } from "@/lib/insum/export";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios · INSUM CERTO" },
      {
        name: "description",
        content: "Relatórios de insumos filtráveis por período, fazenda, produto e ordem de serviço, com exportação em Excel e PDF.",
      },
      { property: "og:title", content: "Relatórios · INSUM CERTO" },
      { property: "og:description", content: "Filtre por período, fazenda, produto e OS e exporte em Excel ou PDF." },
    ],
  }),
  component: Relatorios,
});

function Relatorios() {
  const { data, produto, fazenda, ordem, talhaoNome, eventosDe } = useApp();
  const [de, setDe] = useState("2026-09-10");
  const [ate, setAte] = useState("2026-09-22");
  const [fazendaId, setFazendaId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [osId, setOsId] = useState("");

  const linhasDados = data.insumos
    .filter((i) => {
      if (fazendaId && i.fazendaId !== fazendaId) return false;
      if (produtoId && i.produtoId !== produtoId) return false;
      if (osId && i.osId !== osId) return false;
      const eventos = eventosDe(i.id);
      const ultimo = eventos[eventos.length - 1];
      if (!ultimo) return false;
      const d = ultimo.dataHora.slice(0, 10);
      return d >= de && d <= ate;
    })
    .map((i) => {
      const eventos = eventosDe(i.id);
      const ultimo = eventos[eventos.length - 1]!;
      const p = produto(i.produtoId)!;
      return {
        qr: i.qrCode,
        produto: p.nome,
        lote: i.lote,
        retirado: `${i.quantidade} ${p.unidade}`,
        aplicado: i.quantidadeAplicada !== undefined ? `${i.quantidadeAplicada} ${p.unidade}` : "—",
        os: ordem(i.osId)?.codigo ?? "",
        local: `${fazenda(i.fazendaId)?.nome} · ${talhaoNome(i.fazendaId, i.talhaoId)}`,
        status: statusLabel[i.status] ?? i.status,
        ultima: fmtDataHora(ultimo.dataHora),
        responsavel: ultimo.responsavel,
      };
    });

  const colunas = ["QR Code", "Produto", "Lote", "Retirado", "Aplicado", "OS", "Fazenda / Talhão", "Status", "Última leitura", "Responsável"];
  const matriz = linhasDados.map((l) => [l.qr, l.produto, l.lote, l.retirado, l.aplicado, l.os, l.local, l.status, l.ultima, l.responsavel]);
  const subtitulo = `Período ${new Date(de + "T12:00:00").toLocaleDateString("pt-BR")} a ${new Date(ate + "T12:00:00").toLocaleDateString("pt-BR")} · ${linhasDados.length} registros`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Relatórios</h1>
        <p className="mt-1 text-sm text-muted-foreground">Filtre e exporte o histórico de rastreabilidade.</p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:grid-cols-2 xl:grid-cols-5">
        <Campo label="De">
          <input type="date" value={de} onChange={(e) => setDe(e.target.value)} className={inputCls} />
        </Campo>
        <Campo label="Até">
          <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className={inputCls} />
        </Campo>
        <Campo label="Fazenda">
          <select value={fazendaId} onChange={(e) => setFazendaId(e.target.value)} className={inputCls}>
            <option value="">Todas</option>
            {data.fazendas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Produto">
          <select value={produtoId} onChange={(e) => setProdutoId(e.target.value)} className={inputCls}>
            <option value="">Todos</option>
            {data.produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Ordem de serviço">
          <select value={osId} onChange={(e) => setOsId(e.target.value)} className={inputCls}>
            <option value="">Todas</option>
            {data.ordens.map((o) => (
              <option key={o.id} value={o.id}>
                {o.codigo}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={() => exportarCsv("insumcerto-relatorio", colunas, matriz)}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-card"
        >
          <FileSpreadsheet className="h-5 w-5" /> Exportar Excel
        </button>
        <button
          onClick={() => exportarPdf("Relatório de rastreabilidade", subtitulo, colunas, matriz)}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-sm font-bold text-secondary-foreground"
        >
          <FileText className="h-5 w-5" /> Exportar PDF
        </button>
      </div>

      <p className="text-sm text-muted-foreground">{subtitulo}</p>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-secondary/60">
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              {colunas.map((c) => (
                <th key={c} className="px-3 py-3 whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {linhasDados.map((l) => (
              <tr key={l.qr}>
                <td className="px-3 py-3 font-semibold text-foreground">{l.qr}</td>
                <td className="px-3 py-3 text-foreground">{l.produto}</td>
                <td className="px-3 py-3 text-muted-foreground">{l.lote}</td>
                <td className="px-3 py-3 text-muted-foreground">{l.retirado}</td>
                <td className="px-3 py-3 text-muted-foreground">{l.aplicado}</td>
                <td className="px-3 py-3 text-muted-foreground">{l.os}</td>
                <td className="px-3 py-3 text-muted-foreground">{l.local}</td>
                <td className="px-3 py-3">
                  <StatusBadge status={Object.keys(statusLabel).find((k) => statusLabel[k] === l.status) ?? "pendente"} label={l.status} />
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{l.ultima}</td>
                <td className="px-3 py-3 text-muted-foreground">{l.responsavel}</td>
              </tr>
            ))}
            {linhasDados.length === 0 && (
              <tr>
                <td colSpan={colunas.length} className="px-3 py-8 text-center text-muted-foreground">
                  Nenhum registro no filtro selecionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
