import type { Fazenda } from "./types";
import { faixaHex } from "./estouro";

export interface PinoPdf {
  lat: number;
  lng: number;
  hex: string;
}

export interface LinhaTalhaoPdf {
  talhao: string;
  area: string;
  produto: string;
  recomendado: string;
  aplicado: string;
  estouro: string;
  hex?: string;
}

const TILE = (z: number, x: number, y: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

function mundo(lat: number, lng: number, z: number) {
  const s = 256 * 2 ** z;
  const sin = Math.sin((lat * Math.PI) / 180);
  return { x: ((lng + 180) / 360) * s, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * s };
}

function carregar(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const t = setTimeout(() => resolve(null), 6000);
    img.onload = () => { clearTimeout(t); resolve(img); };
    img.onerror = () => { clearTimeout(t); resolve(null); };
    img.src = url;
  });
}

/** Desenha o mapa da fazenda num canvas. Tenta satélite; se falhar (CORS/rede), usa fundo neutro. */
export async function renderMapaFazenda(f: Fazenda, pinos: PinoPdf[], w = 1100, h = 680) {
  const pts: [number, number][] = [[f.sede.lat, f.sede.lng], ...f.talhoes.flatMap((t) => t.poligono), ...pinos.map((p) => [p.lat, p.lng] as [number, number])];
  const lats = pts.map((p) => p[0]);
  const lngs = pts.map((p) => p[1]);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  let z = 17;
  for (; z > 3; z--) {
    const a = mundo(maxLat, minLng, z);
    const b = mundo(minLat, maxLng, z);
    if (b.x - a.x < w * 0.8 && b.y - a.y < h * 0.8) break;
  }
  const c = mundo((minLat + maxLat) / 2, (minLng + maxLng) / 2, z);
  const ox = c.x - w / 2;
  const oy = c.y - h / 2;
  const proj = (lat: number, lng: number) => { const m = mundo(lat, lng, z); return { x: m.x - ox, y: m.y - oy }; };

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const desenharFundoNeutro = () => {
    ctx.fillStyle = "#eef2ee";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#dbe3dc";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  };

  let satelite = false;
  try {
    const tiles: { x: number; y: number; url: string }[] = [];
    for (let tx = Math.floor(ox / 256); tx <= Math.floor((ox + w) / 256); tx++)
      for (let ty = Math.floor(oy / 256); ty <= Math.floor((oy + h) / 256); ty++)
        tiles.push({ x: tx * 256 - ox, y: ty * 256 - oy, url: TILE(z, tx, ty) });
    const imgs = await Promise.all(tiles.map((t) => carregar(t.url)));
    if (imgs.every(Boolean)) {
      imgs.forEach((img, i) => ctx.drawImage(img!, tiles[i]!.x, tiles[i]!.y, 256, 256));
      canvas.toDataURL("image/jpeg"); // lança erro se o canvas estiver "tainted"
      satelite = true;
    }
  } catch {
    satelite = false;
  }
  if (!satelite) desenharFundoNeutro();

  // Talhões
  for (const t of f.talhoes) {
    ctx.beginPath();
    t.poligono.forEach(([lat, lng], i) => { const p = proj(lat, lng); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
    ctx.closePath();
    ctx.fillStyle = satelite ? "rgba(250,204,21,0.18)" : "rgba(47,138,82,0.18)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = satelite ? "#facc15" : "#1d5c3a";
    ctx.stroke();
    const cx = t.poligono.reduce((s, p) => s + proj(p[0], p[1]).x, 0) / t.poligono.length;
    const cy = t.poligono.reduce((s, p) => s + proj(p[0], p[1]).y, 0) / t.poligono.length;
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    const label = `${t.nome} · ${t.areaHa} ha`;
    const lw = ctx.measureText(label).width + 14;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(cx - lw / 2, cy - 30, lw, 26);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, cx, cy - 11);
  }

  // Sede
  const s = proj(f.sede.lat, f.sede.lng);
  ctx.fillStyle = "#1e293b";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.fillRect(s.x - 10, s.y - 10, 20, 20);
  ctx.strokeRect(s.x - 10, s.y - 10, 20, 20);
  ctx.font = "bold 16px sans-serif";
  ctx.fillStyle = satelite ? "#fff" : "#1e293b";
  ctx.fillText("Sede", s.x, s.y + 30);

  // Aplicações
  for (const p of pinos) {
    const q = proj(p.lat, p.lng);
    ctx.beginPath();
    ctx.arc(q.x, q.y, 11, 0, Math.PI * 2);
    ctx.fillStyle = p.hex;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#fff";
    ctx.stroke();
  }

  return { dataUrl: canvas.toDataURL("image/jpeg", 0.9), satelite, w, h };
}

export async function baixarPdfFazenda(f: Fazenda, pinos: PinoPdf[], linhas: LinhaTalhaoPdf[], limites: { atencao: number; critico: number }) {
  const { jsPDF } = await import("jspdf");
  const mapa = await renderMapaFazenda(f, pinos);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const M = 12;

  // Cabeçalho
  doc.setFillColor(29, 92, 58);
  doc.rect(0, 0, W, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Insumo Certo", M, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Controle e rastreabilidade de insumos agrícolas", M, 17);
  doc.text(`Emitido em ${new Date().toLocaleString("pt-BR")}`, W - M, 11, { align: "right" });

  doc.setTextColor(20, 40, 29);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(f.nome, M, 34);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${f.municipio} · ${f.talhoes.length} talhões · ${f.talhoes.reduce((s, t) => s + t.areaHa, 0).toLocaleString("pt-BR")} ha`, M, 40);

  // Mapa
  const mw = W - 2 * M;
  const mh = (mw * mapa.h) / mapa.w;
  doc.addImage(mapa.dataUrl, "JPEG", M, 45, mw, mh);
  let y = 45 + mh + 6;
  doc.setFontSize(8);
  doc.setTextColor(90, 105, 96);
  doc.text(mapa.satelite ? "Imagem de satélite: Esri World Imagery" : "Mapa esquemático (imagem de satélite indisponível)", M, y);
  y += 6;

  // Legenda
  const leg: [string, string][] = [
    [faixaHex.padrao, `Dentro do padrão (até ${limites.atencao}%)`],
    [faixaHex.atencao, `Atenção (${limites.atencao}% a ${limites.critico}%)`],
    [faixaHex.critico, `Crítico (acima de ${limites.critico}%)`],
  ];
  let x = M;
  doc.setFontSize(9);
  doc.setTextColor(20, 40, 29);
  for (const [hex, txt] of leg) {
    doc.setFillColor(hex);
    doc.circle(x + 2, y - 1.2, 2, "F");
    doc.text(txt, x + 6, y);
    x += doc.getTextWidth(txt) + 14;
  }
  y += 8;

  // Tabela
  const cols = [
    { t: "Talhão", w: 30 },
    { t: "Área (ha)", w: 18 },
    { t: "Produto aplicado", w: 54 },
    { t: "Recomendado", w: 26 },
    { t: "Aplicado", w: 26 },
    { t: "Estouro %", w: 32 },
  ];
  const linha = (vals: string[], header = false, hex?: string) => {
    if (y > 280) { doc.addPage(); y = 16; }
    if (header) { doc.setFillColor(29, 92, 58); doc.rect(M, y - 4.5, mw, 7, "F"); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); }
    else { doc.setTextColor(20, 40, 29); doc.setFont("helvetica", "normal"); }
    let cx = M + 1.5;
    vals.forEach((v, i) => {
      if (!header && i === 5 && hex) { doc.setTextColor(hex); doc.setFont("helvetica", "bold"); }
      doc.text(v, cx, y, { maxWidth: cols[i]!.w - 2 });
      cx += cols[i]!.w;
    });
    if (!header) { doc.setDrawColor(226, 232, 228); doc.line(M, y + 2.5, M + mw, y + 2.5); }
    y += 7;
  };
  doc.setFontSize(8.5);
  linha(cols.map((c) => c.t), true);
  for (const l of linhas) linha([l.talhao, l.area, l.produto, l.recomendado, l.aplicado, l.estouro], false, l.hex);

  doc.save(`mapa-${f.nome.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-")}.pdf`);
  return mapa.satelite;
}
