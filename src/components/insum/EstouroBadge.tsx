import { cn } from "@/lib/utils";
import { faixaEstouro, fmtEstouro, type FaixaEstouro } from "@/lib/insum/estouro";
import { useApp } from "@/lib/insum/store";

const tom: Record<FaixaEstouro, string> = {
  padrao: "bg-success/15 text-success",
  atencao: "bg-warning/25 text-warning-foreground",
  critico: "bg-destructive/15 text-destructive",
};

export function EstouroBadge({ percentual, className }: { percentual: number; className?: string }) {
  const { data } = useApp();
  const f = faixaEstouro(percentual, data.config);
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold whitespace-nowrap", tom[f], className)}>
      {fmtEstouro(percentual)}
      {percentual < 0 && <span className="ml-1 font-semibold opacity-80">sub</span>}
    </span>
  );
}
