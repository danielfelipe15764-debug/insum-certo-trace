import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import QRCode from "qrcode";
import { format, differenceInCalendarDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, CalendarIcon, Printer, QrCode as QrIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/insum/store";
import type { Insumo } from "@/lib/insum/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  produtoId: z.string().min(1, "Selecione o produto"),
  osId: z.string().min(1, "Selecione a ordem de serviço"),
  notaFiscal: z.string().trim().min(1, "Informe a nota fiscal").max(20).regex(/^\d+$/, "Use apenas números"),
  lote: z.string().trim().min(1, "Informe o lote").max(30),
  vencimento: z
    .date({ required_error: "Informe a data de vencimento" })
    .refine((d) => startOfDay(d) >= startOfDay(new Date()), "O vencimento não pode ser uma data passada"),
  quantidade: z.string().optional().refine((v) => !v || Number(v) > 0, "Quantidade inválida"),
  unidade: z.string().max(10).optional(),
});
type Valores = z.infer<typeof schema>;

const fmtData = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("pt-BR");

export function imprimirEtiquetaInsumo(ins: Insumo, produtoNome: string, url: string, copias: number) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) { toast.error("Permita pop-ups para imprimir."); return; }
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const e = `<div class="e"><img src="${url}"/><b>${esc(ins.qrCode)}</b><span class="p">${esc(produtoNome)}</span>
    <span>NF: <strong>${esc(ins.notaFiscal)}</strong></span><span>Lote: <strong>${esc(ins.lote)}</strong></span>
    <span>Vencimento: <strong>${fmtData(ins.vencimento)}</strong></span><small>Insumo Certo</small></div>`;
  w.document.write(`<html><head><title>${esc(ins.qrCode)}</title><style>
    body{font-family:sans-serif;margin:16px;display:flex;flex-wrap:wrap;gap:12px}
    .e{width:220px;border:1px dashed #999;padding:10px;text-align:center;display:flex;flex-direction:column;gap:3px;page-break-inside:avoid;font-size:12px}
    .e img{width:180px;height:180px;margin:0 auto}.e b{font-size:14px}.e .p{font-size:13px;font-weight:700}.e small{font-size:10px;color:#666}
  </style></head><body>${e.repeat(copias)}<script>window.onload=()=>{window.print()}</script></body></html>`);
  w.document.close();
}

export function NovoQrForm() {
  const { data, produto, criarInsumo } = useApp();
  const [criado, setCriado] = useState<Insumo | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [copias, setCopias] = useState(1);

  const form = useForm<Valores>({
    resolver: zodResolver(schema),
    defaultValues: {
      produtoId: "",
      osId: data.ordens.find((o) => o.status !== "concluida")?.id ?? "",
      notaFiscal: "",
      lote: "",
      quantidade: "",
      unidade: "",
    },
  });
  const venc = form.watch("vencimento");
  const dias = venc ? differenceInCalendarDays(venc, new Date()) : null;

  useEffect(() => {
    if (!criado) return;
    QRCode.toDataURL(criado.qrCode, { width: 360, margin: 1 }).then(setUrl).catch(() => setUrl(null));
  }, [criado]);

  function salvar(v: Valores) {
    const ins = criarInsumo({
      produtoId: v.produtoId,
      osId: v.osId,
      notaFiscal: v.notaFiscal,
      lote: v.lote,
      vencimento: format(v.vencimento, "yyyy-MM-dd"),
      quantidade: v.quantidade ? Number(v.quantidade) : undefined,
      unidade: v.unidade || undefined,
    });
    setCriado(ins);
    toast.success(`QR Code ${ins.qrCode} gerado`);
    form.reset({ ...form.getValues(), notaFiscal: "", lote: "", quantidade: "" });
  }

  const prodSel = produto(form.watch("produtoId"));

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-foreground">
        <QrIcon className="h-5 w-5 text-primary" /> Novo QR Code
      </h2>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(salvar)} className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="produtoId" render={({ field }) => (
              <FormItem>
                <FormLabel>Produto *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="h-12"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                  <SelectContent>{data.produtos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="osId" render={({ field }) => (
              <FormItem>
                <FormLabel>Ordem de serviço *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="h-12"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                  <SelectContent>{data.ordens.map((o) => <SelectItem key={o.id} value={o.id}>{o.codigo} · {o.descricao}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notaFiscal" render={({ field }) => (
              <FormItem>
                <FormLabel>Nota fiscal (NF) *</FormLabel>
                <FormControl><Input inputMode="numeric" placeholder="Ex.: 45321" className="h-12" maxLength={20} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="lote" render={({ field }) => (
              <FormItem>
                <FormLabel>Lote *</FormLabel>
                <FormControl><Input placeholder="Ex.: L-2410-A" className="h-12" maxLength={30} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="vencimento" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de vencimento *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("h-12 justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                        <CalendarIcon className="h-4 w-4" />
                        {field.value ? format(field.value, "dd/MM/yyyy") : <span>Escolha a data</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(d) => startOfDay(d) < startOfDay(new Date())}
                      locale={ptBR}
                      initialFocus
                      className="pointer-events-auto p-3"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="quantidade" render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl><Input type="number" min={0} step="any" className="h-12" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="unidade" render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade</FormLabel>
                  <FormControl><Input placeholder={prodSel?.unidade ?? "L, kg, t"} className="h-12" maxLength={10} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            {dias !== null && dias >= 0 && dias < 30 && (
              <p className="flex items-center gap-2 rounded-xl bg-warning/20 px-3 py-2 text-sm font-semibold text-warning-foreground sm:col-span-2">
                <AlertTriangle className="h-4 w-4 shrink-0" /> Atenção: faltam {dias} dia{dias === 1 ? "" : "s"} para o vencimento deste lote.
              </p>
            )}
            <Button type="submit" className="h-12 text-base font-bold sm:col-span-2">
              <QrIcon className="h-5 w-5" /> Gerar QR Code
            </Button>
          </form>
        </Form>

        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-4 text-center">
          {criado && url ? (
            <>
              <img src={url} alt={`QR Code ${criado.qrCode}`} className="h-40 w-40 rounded-lg bg-background p-1" />
              <p className="mt-2 font-mono text-sm font-bold text-foreground">{criado.qrCode}</p>
              <p className="text-sm font-semibold text-foreground">{produto(criado.produtoId)?.nome}</p>
              <p className="text-xs text-muted-foreground">NF {criado.notaFiscal} · Lote {criado.lote} · Venc. {fmtData(criado.vencimento)}</p>
              <div className="mt-3 flex w-full gap-2">
                <Input type="number" min={1} max={100} value={copias} aria-label="Cópias" className="h-12 w-20 text-center"
                  onChange={(e) => setCopias(Math.max(1, Math.min(100, Number(e.target.value) || 1)))} />
                <Button className="h-12 flex-1" onClick={() => imprimirEtiquetaInsumo(criado, produto(criado.produtoId)?.nome ?? "", url, copias)}>
                  <Printer className="h-4 w-4" /> Imprimir etiquetas
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">O QR Code gerado aparece aqui, pronto para imprimir.</p>
          )}
        </div>
      </div>
    </section>
  );
}
