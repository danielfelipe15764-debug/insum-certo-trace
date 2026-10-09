import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Printer, Save, QrCode as QrIcon } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/insum/store";
import type { Produto } from "@/lib/insum/types";

export const Route = createFileRoute("/gerar-qr")({
  head: () => ({
    meta: [
      { title: "Gerar QR Code · Insumo Certo" },
      { name: "description", content: "Gere e imprima QR Codes a partir do código de cada produto." },
      { property: "og:title", content: "Gerar QR Code · Insumo Certo" },
      { property: "og:description", content: "Gere e imprima QR Codes a partir do código de cada produto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GerarQr,
});

function imprimir(p: Produto, url: string, copias: number) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) { toast.error("Permita pop-ups para imprimir."); return; }
  const etiqueta = `<div class="e"><img src="${url}"/><b>${p.codigo}</b><span>${p.nome}</span><small>Insumo Certo</small></div>`;
  w.document.write(`<html><head><title>QR ${p.codigo}</title><style>
    body{font-family:sans-serif;margin:16px;display:flex;flex-wrap:wrap;gap:12px}
    .e{width:200px;border:1px dashed #999;padding:10px;text-align:center;display:flex;flex-direction:column;gap:4px;page-break-inside:avoid}
    .e img{width:180px;height:180px;margin:0 auto}.e b{font-size:16px}.e span{font-size:12px}.e small{font-size:10px;color:#666}
  </style></head><body>${etiqueta.repeat(copias)}<script>window.onload=()=>{window.print()}</script></body></html>`);
  w.document.close();
}

function CartaoProduto({ p }: { p: Produto }) {
  const { definirCodigoProduto } = useApp();
  const [codigo, setCodigo] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [copias, setCopias] = useState(1);

  useEffect(() => {
    if (!p.codigo) { setUrl(null); return; }
    QRCode.toDataURL(p.codigo, { width: 360, margin: 1 }).then(setUrl).catch(() => setUrl(null));
  }, [p.codigo]);

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-card">
      <p className="font-bold text-foreground">{p.nome}</p>
      <p className="text-xs text-muted-foreground">{p.categoria} · {p.unidade}</p>
      {p.codigo && url ? (
        <>
          <img src={url} alt={`QR Code ${p.codigo}`} className="mx-auto my-3 h-40 w-40 rounded-lg bg-background p-1" />
          <p className="text-center font-mono text-sm font-semibold">{p.codigo}</p>
          <div className="mt-3 flex gap-2">
            <input
              type="number" min={1} max={100} value={copias}
              onChange={(e) => setCopias(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
              className="h-12 w-20 rounded-xl border border-input bg-background px-3 text-center"
              aria-label="Cópias"
            />
            <button
              onClick={() => imprimir(p, url, copias)}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground"
            >
              <Printer className="h-5 w-5" /> Imprimir QR Code
            </button>
          </div>
        </>
      ) : (
        <div className="mt-3 flex flex-1 flex-col justify-end gap-2">
          <p className="rounded-xl bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
            Produto sem código. Cadastre para gerar o QR Code.
          </p>
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="Ex.: MAP-GRAN"
            maxLength={30}
            className="h-12 rounded-xl border border-input bg-background px-4"
          />
          <button
            onClick={() => {
              if (!codigo.trim()) { toast.error("Informe o código do produto."); return; }
              definirCodigoProduto(p.id, codigo);
              toast.success("Código cadastrado e QR Code gerado.");
            }}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-secondary font-semibold text-secondary-foreground"
          >
            <Save className="h-5 w-5" /> Cadastrar código
          </button>
        </div>
      )}
    </div>
  );
}

function GerarQr() {
  const { data } = useApp();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-foreground">
          <QrIcon className="h-6 w-6 text-primary" /> Gerar QR Code
        </h1>
        <p className="text-sm text-muted-foreground">
          QR Codes gerados a partir do código de cada produto. Cadastre o código quando estiver faltando e imprima as etiquetas.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.produtos.map((p) => <CartaoProduto key={p.id} p={p} />)}
      </div>
    </div>
  );
}
