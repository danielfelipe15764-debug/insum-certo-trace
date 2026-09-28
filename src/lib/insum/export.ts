export function exportarCsv(nome: string, colunas: string[], linhas: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [colunas.map(esc).join(";"), ...linhas.map((l) => l.map(esc).join(";"))].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nome}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportarPdf(titulo: string, subtitulo: string, colunas: string[], linhas: (string | number)[][]) {
  const w = window.open("", "_blank", "width=1024,height=720");
  if (!w) return;
  const esc = (s: string | number) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(titulo)}</title>
  <style>
    body{font-family:Segoe UI,Arial,sans-serif;margin:32px;color:#14281d}
    h1{margin:0;font-size:20px;color:#1d5c3a}
    p.sub{margin:4px 0 20px;color:#5b6b60;font-size:12px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th{background:#1d5c3a;color:#fff;text-align:left;padding:7px 8px}
    td{border-bottom:1px solid #e2e8e4;padding:6px 8px}
    tr:nth-child(even) td{background:#f5f9f6}
    .brand{font-weight:800;letter-spacing:-.3px}
  </style></head><body>
  <div class="brand" style="color:#1d5c3a;font-size:14px">Insumo Certo</div>
  <h1>${esc(titulo)}</h1><p class="sub">${esc(subtitulo)}</p>
  <table><thead><tr>${colunas.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
  <tbody>${linhas.map((l) => `<tr>${l.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>
  </body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 350);
}
