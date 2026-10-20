import { Navigation, Radio } from "lucide-react";
import type { Evento, Insumo } from "@/lib/insum/types";
import { calcularEstouro, fmtEstouro } from "@/lib/insum/estouro";
import { fmtCoord } from "@/lib/insum/geo";
import { fmtDataHora } from "@/lib/insum/store";
import { SatMap } from "./SatMap";
import type { MapPin } from "./map-types";

export const tipoPin: Record<Evento["tipo"], { cor: string; letra: string; nome: string }> = {
  cadastro: { cor: "#64748b", letra: "C", nome: "Cadastro" },
  saida: { cor: "#2563eb", letra: "R", nome: "Retirada (saída do almoxarifado)" },
  chegada: { cor: "#d97706", letra: "F", nome: "Chegada / leitura na fazenda" },
  aplicacao: { cor: "#16a34a", letra: "A", nome: "Aplicação no talhão" },
};

export function RouteTrackingMap({ insumo, eventos }: { insumo: Insumo; eventos: Evento[] }) {
  const emTransporte = insumo.status === "em_transporte";
  const concluido = insumo.status === "entregue" || insumo.status === "aplicado";
  const est = calcularEstouro(insumo);
  const pins: MapPin[] = eventos
    .filter((e) => e.tipo !== "cadastro" || eventos.length === 1)
    .map((e) => ({
      id: e.id,
      lat: e.lat,
      lng: e.lng,
      cor: tipoPin[e.tipo].cor,
      letra: tipoPin[e.tipo].letra,
      titulo: tipoPin[e.tipo].nome,
      linhas: [
        fmtDataHora(e.dataHora),
        `Responsável: ${e.responsavel}`,
        `Lat/long: ${fmtCoord(e.lat, e.lng)}${e.localizacaoSimulada ? " (simulada)" : ""}`,
        ...(e.tipo === "aplicacao" && est ? [`Estouro: ${fmtEstouro(est.percentual)}`] : []),
      ],
    }));

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Mapa das leituras</h3>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${emTransporte ? "bg-info/15 text-info" : concluido ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
          <Radio className={`h-3.5 w-3.5 ${emTransporte ? "animate-pulse" : ""}`} />
          {emTransporte ? "Em transporte" : concluido ? "Chegou ao destino" : "Aguardando saída"}
        </span>
      </div>
      <div className="p-2">
        <SatMap pins={pins} linha altura={360} />
      </div>
      <div className="flex flex-wrap gap-3 px-4 pb-3 text-xs text-muted-foreground">
        {(["saida", "chegada", "aplicacao"] as const).map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: tipoPin[t].cor }} /> {tipoPin[t].nome}
          </span>
        ))}
      </div>
    </section>
  );
}
