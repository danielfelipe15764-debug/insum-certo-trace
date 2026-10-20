import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { fmtCoord, googleMapsUrl } from "@/lib/insum/geo";

export function Coordenadas({ lat, lng, simulada }: { lat: number; lng: number; simulada?: boolean | undefined }) {
  const txt = fmtCoord(lat, lng);
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className="font-mono font-semibold text-foreground">{txt}</span>
      {simulada && <span className="rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-bold text-warning-foreground">localização simulada</span>}
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(txt).then(() => toast.success("Coordenadas copiadas"), () => toast.error("Não foi possível copiar"));
        }}
        className="inline-flex items-center gap-1 font-semibold text-primary"
      >
        <Copy className="h-3.5 w-3.5" /> copiar coordenadas
      </button>
      <a href={googleMapsUrl(lat, lng)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary">
        <ExternalLink className="h-3.5 w-3.5" /> abrir no Google Maps
      </a>
    </span>
  );
}
