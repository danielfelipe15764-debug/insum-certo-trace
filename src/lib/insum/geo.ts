export const ALMOXARIFADO = { nome: "Almoxarifado Central", lat: -17.7923, lng: -50.9192 };

export function fmtCoord(lat: number, lng: number) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export function googleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export function centroide(poligono: [number, number][]): { lat: number; lng: number } {
  const n = poligono.length || 1;
  return {
    lat: poligono.reduce((s, p) => s + p[0], 0) / n,
    lng: poligono.reduce((s, p) => s + p[1], 0) / n,
  };
}

/** Retângulo de área `ha` com canto sudoeste em (lat, lng). */
export function retanguloHa(lat: number, lng: number, ha: number, proporcao = 1.4): [number, number][] {
  const m2 = ha * 10000;
  const largura = Math.sqrt(m2 * proporcao); // leste-oeste (m)
  const altura = m2 / largura; // norte-sul (m)
  const dLat = altura / 111320;
  const dLng = largura / (111320 * Math.cos((lat * Math.PI) / 180));
  return [
    [lat, lng],
    [lat + dLat, lng + dLng * 0.04],
    [lat + dLat, lng + dLng],
    [lat, lng + dLng * 0.96],
  ];
}

export const TILE_SATELITE =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
export const ATRIBUICAO_SATELITE =
  "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community";
