import { cn } from "@/lib/utils";
import { statusLabel } from "@/lib/insum/store";

const tone: Record<string, string> = {
  pendente: "bg-muted text-muted-foreground",
  em_transporte: "bg-info/15 text-info",
  entregue: "bg-warning/20 text-warning-foreground",
  aplicado: "bg-success/15 text-success",
  aberta: "bg-muted text-muted-foreground",
  em_andamento: "bg-info/15 text-info",
  concluida: "bg-success/15 text-success",
  alta: "bg-destructive/12 text-destructive",
  media: "bg-warning/20 text-warning-foreground",
  baixa: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        tone[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {label ?? statusLabel[status] ?? status}
    </span>
  );
}
