export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  /** Cor CSS do marcador */
  cor: string;
  /** Letra/símbolo curto no marcador */
  letra: string;
  titulo: string;
  linhas: string[];
}

export interface MapPoly {
  id: string;
  pontos: [number, number][];
  nome: string;
  cor?: string;
}

export interface SatMapProps {
  pins: MapPin[];
  /** Liga os pins em ordem */
  linha?: boolean;
  poligonos?: MapPoly[];
  altura?: number;
  zoomMax?: number;
}
