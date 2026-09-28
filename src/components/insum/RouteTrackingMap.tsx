import { Clock3, MapPin, Navigation, Radio, Truck } from "lucide-react";
import type { Fazenda, Insumo } from "@/lib/insum/types";

interface RouteTrackingMapProps {
  insumo: Insumo;
  destino?: Fazenda;
}

const routeInfo: Record<string, { distancia: string; duracao: string }> = {
  "faz-1": { distancia: "42 km", duracao: "48 min" },
  "faz-2": { distancia: "87 km", duracao: "1h 24 min" },
  "faz-3": { distancia: "164 km", duracao: "2h 35 min" },
  "faz-4": { distancia: "231 km", duracao: "3h 18 min" },
};

export function RouteTrackingMap({ insumo, destino }: RouteTrackingMapProps) {
  const emTransporte = insumo.status === "em_transporte";
  const concluido = insumo.status === "entregue" || insumo.status === "aplicado";
  const info = routeInfo[insumo.fazendaId] ?? { distancia: "68 km", duracao: "1h 10 min" };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Rastreio do transporte</h3>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">Posição simulada para apresentação</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${emTransporte ? "bg-info/15 text-info" : concluido ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
          <Radio className={`h-3.5 w-3.5 ${emTransporte ? "animate-pulse" : ""}`} />
          {emTransporte ? "Em movimento" : concluido ? "Chegou ao destino" : "Aguardando saída"}
        </span>
      </div>

      <div className="relative h-[300px] overflow-hidden bg-secondary sm:h-[360px]">
        <div className="absolute inset-0 opacity-55 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="absolute -left-12 top-20 h-28 w-[120%] rotate-6 border-y-[18px] border-card bg-muted shadow-card" />
        <div className="absolute -left-12 top-[180px] h-20 w-[120%] -rotate-12 border-y-[12px] border-card bg-muted" />
        <div className="absolute left-[8%] top-[22%] h-[52%] w-[77%] rounded-[50%] border-[5px] border-dashed border-info/75 rotate-3" />

        <div className="absolute left-[7%] top-[62%] flex -translate-x-1/2 flex-col items-center">
          <span className="grid h-11 w-11 place-items-center rounded-full border-4 border-card bg-foreground text-card shadow-card">
            <MapPin className="h-5 w-5" />
          </span>
          <span className="mt-1 rounded-md bg-card px-2 py-1 text-[10px] font-bold text-foreground shadow-card">Almoxarifado</span>
        </div>

        <div className={`absolute ${concluido ? "left-[83%] top-[31%]" : emTransporte ? "left-[47%] top-[25%]" : "left-[13%] top-[57%]"} z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-all duration-700`}>
          <span className={`grid h-12 w-12 place-items-center rounded-full border-4 border-card text-primary-foreground shadow-card ${emTransporte ? "bg-info" : concluido ? "bg-success" : "bg-muted-foreground"}`}>
            <Truck className="h-6 w-6" />
          </span>
          <span className="mt-1 whitespace-nowrap rounded-md bg-card px-2 py-1 text-[10px] font-bold text-foreground shadow-card">
            {insumo.veiculo ?? "Veículo aguardando"}
          </span>
        </div>

        <div className="absolute left-[84%] top-[27%] flex -translate-x-1/2 flex-col items-center">
          <span className="grid h-11 w-11 place-items-center rounded-full border-4 border-card bg-primary text-primary-foreground shadow-card">
            <MapPin className="h-5 w-5" />
          </span>
          <span className="mt-1 max-w-28 rounded-md bg-card px-2 py-1 text-center text-[10px] font-bold leading-tight text-foreground shadow-card">
            {destino?.nome ?? "Fazenda de destino"}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 right-3 grid grid-cols-3 gap-2 rounded-lg border border-border bg-card/95 p-3 shadow-card backdrop-blur">
          <Metric label="Distância" value={info.distancia} />
          <Metric label={emTransporte ? "Previsão" : "Tempo de rota"} value={info.duracao} />
          <Metric label="Motorista" value={insumo.motorista ?? "A definir"} />
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <Location label="Origem" value="Almoxarifado Central" />
        <div className="hidden h-px w-16 bg-border sm:block" />
        <Location label="Destino" value={`${destino?.nome ?? "Fazenda"} · ${destino?.municipio ?? "—"}`} align="right" />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 text-center">
      <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground"><Clock3 className="h-3 w-3" /> {label}</p>
      <p className="truncate text-xs font-extrabold text-foreground sm:text-sm">{value}</p>
    </div>
  );
}

function Location({ label, value, align = "left" }: { label: string; value: string; align?: "left" | "right" }) {
  return (
    <div className={align === "right" ? "sm:text-right" : ""}>
      <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}