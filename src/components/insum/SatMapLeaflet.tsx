import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { ATRIBUICAO_SATELITE, TILE_SATELITE } from "@/lib/insum/geo";
import type { MapPin, SatMapProps } from "./map-types";

function icone(p: MapPin) {
  return L.divIcon({
    className: "",
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -36],
    html: `<div style="position:relative;width:34px;height:42px">
      <div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${p.cor};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.45)"></div>
      <span style="position:absolute;top:0;left:0;width:34px;height:34px;display:grid;place-items:center;color:#fff;font:800 13px/1 sans-serif">${p.letra}</span>
    </div>`,
  });
}

function Ajustar({ pontos, zoomMax }: { pontos: [number, number][]; zoomMax: number }) {
  const map = useMap();
  const chave = JSON.stringify(pontos);
  useEffect(() => {
    map.invalidateSize();
    if (pontos.length === 1) map.setView(pontos[0]!, Math.min(zoomMax, 15));
    else if (pontos.length > 1) map.fitBounds(L.latLngBounds(pontos), { padding: [40, 40], maxZoom: zoomMax });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, chave]);
  return null;
}

export default function SatMapLeaflet({ pins, linha, poligonos = [], altura = 340, zoomMax = 16 }: SatMapProps) {
  const pontos = useMemo<[number, number][]>(
    () => [...pins.map((p) => [p.lat, p.lng] as [number, number]), ...poligonos.flatMap((p) => p.pontos)],
    [pins, poligonos],
  );
  const centro = pontos[0] ?? [-17.79, -50.92];

  return (
    <div className="isolate overflow-hidden rounded-xl" style={{ height: altura }}>
      <MapContainer center={centro} zoom={13} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer url={TILE_SATELITE} attribution={ATRIBUICAO_SATELITE} maxZoom={19} />
        <Ajustar pontos={pontos} zoomMax={zoomMax} />
        {poligonos.map((p) => (
          <Polygon key={p.id} positions={p.pontos} pathOptions={{ color: p.cor ?? "#facc15", weight: 2, fillOpacity: 0.18 }}>
            <Tooltip permanent direction="center" className="!bg-black/60 !border-0 !text-white !shadow-none !font-bold">
              {p.nome}
            </Tooltip>
          </Polygon>
        ))}
        {linha && pins.length > 1 && (
          <Polyline positions={pins.map((p) => [p.lat, p.lng])} pathOptions={{ color: "#38bdf8", weight: 4, dashArray: "8 8" }} />
        )}
        {pins.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={icone(p)}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <strong style={{ fontSize: 13 }}>{p.titulo}</strong>
                {p.linhas.map((l, i) => (
                  <div key={i} style={{ fontSize: 12, marginTop: 2 }}>
                    {l}
                  </div>
                ))}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
