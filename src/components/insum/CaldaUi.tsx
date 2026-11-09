import type { ReactNode } from "react";
import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { classeLabel, type ClasseConsumo } from "@/lib/insum/calda";
import { fmtPct } from "@/lib/insum/use-calda";

const estilo: Record<ClasseConsumo, string> = {
  dentro: "bg-success/15 text-success",
  acima: "bg-destructive/15 text-destructive",
  abaixo: "bg-warning/20 text-warning-foreground",
  pendente: "bg-muted text-muted-foreground",
  inconsistente: "bg-foreground/10 text-foreground",
};

export function ClasseBadge({ classe }: { classe: ClasseConsumo }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", estilo[classe])}>{classeLabel[classe]}</span>;
}

export function DesvioTexto({ pct, tol }: { pct: number; tol: number }) {
  const a = Math.abs(pct);
  return (
    <span className={cn("font-bold tabular-nums", a <= tol ? "text-success" : a <= tol * 2 ? "text-warning" : "text-destructive")}>{fmtPct(pct)}</span>
  );
}

export function Kpi({ titulo, valor, sub, icon }: { titulo: string; valor: ReactNode; sub?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
        <span>{titulo}</span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-extrabold tabular-nums text-foreground">{valor}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function AvisoDemo() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
      <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
      <p>
        <strong>Dados demonstrativos.</strong> A integração com os sensores de nível e com o Solinftec ainda não está conectada — os valores
        abaixo simulam o funcionamento.
      </p>
    </div>
  );
}

export function Secao({ titulo, children, acao }: { titulo: string; children: ReactNode; acao?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-card lg:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-foreground">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  );
}
