import type { CicloAplicacao, LeituraSensor, Tolerancias } from "./calda";
import { residualEstavel } from "./calda";

/** DADOS DEMONSTRATIVOS — sem integração real com sensores ou Solinftec. */

export const maquinas = [
  { id: "maq-1", nome: "Pulverizador Uniport 3030", sensorId: "SN-LVL-0101", tanqueL: 3000, vies: 0.03 },
  { id: "maq-2", nome: "Pulverizador Jacto 4530", sensorId: "SN-LVL-0102", tanqueL: 3000, vies: 0.14 },
  { id: "maq-3", nome: "Autopropelido JD M4040", sensorId: "SN-LVL-0103", tanqueL: 4000, vies: -0.02 },
  { id: "maq-4", nome: "Pulverizador Case Patriot 250", sensorId: "SN-LVL-0104", tanqueL: 2500, vies: 0.08 },
];

const operadores = [
  { nome: "Carlos Menezes", vies: 0.0 },
  { nome: "João Batista", vies: 0.06 },
  { nome: "Rafael Lima", vies: -0.03 },
  { nome: "Paulo Henrique", vies: 0.1 },
];

const operacoes = [
  { op: "Aplicação de herbicida", produto: "Glifosato 480 SL", conc: "1,5 L/100 L", vazao: 100 },
  { op: "Aplicação de inseticida", produto: "Lambda-cialotrina 250", conc: "0,2 L/100 L", vazao: 120 },
  { op: "Aplicação de maturador", produto: "Maturador Etefon", conc: "0,5 L/100 L", vazao: 50 },
  { op: "Aplicação foliar", produto: "Micronutriente Zn/B", conc: "2 L/100 L", vazao: 80 },
  { op: "Aplicação de fungicida", produto: "Fungicida Triazol", conc: "0,6 L/100 L", vazao: 150 },
];

export const TOLERANCIAS_PADRAO: Tolerancias = {
  "Aplicação de herbicida": 5,
  "Aplicação de inseticida": 5,
  "Aplicação de maturador": 3,
  "Aplicação foliar": 7,
  "Aplicação de fungicida": 5,
};

const talhoes = [
  ["faz-1", "t-1a"], ["faz-1", "t-1b"], ["faz-1", "t-1c"],
  ["faz-2", "t-2a"], ["faz-2", "t-2b"],
  ["faz-3", "t-3a"], ["faz-3", "t-3b"],
  ["faz-4", "t-4a"], ["faz-4", "t-4b"],
] as const;

/** Pseudo-aleatório determinístico (mesmos dados no servidor e no navegador). */
function rnd(i: number, k: number) {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
}
const r1 = (v: number) => Math.round(v * 10) / 10;

function leiturasEstabilizacao(c: Omit<CicloAplicacao, "leituras" | "volumeResidualL">, residual: number, i: number, estavel: boolean): LeituraSensor[] {
  const fim = Date.parse(c.fim);
  return Array.from({ length: 7 }, (_, k) => {
    const ruido = estavel ? (k < 3 ? (3 - k) * 4 : (rnd(i, 40 + k) - 0.5) * 1.2) : (rnd(i, 50 + k) - 0.5) * 30;
    return {
      sensorId: c.sensorId,
      maquinaId: c.maquinaId,
      cicloId: c.id,
      volumeL: r1(Math.max(0, residual + ruido)),
      dataHora: new Date(fim + (k + 1) * 25000).toISOString(),
      estabilidade: estavel ? (k < 3 ? "instavel" : "estavel") : "instavel",
    };
  });
}

function gerar(): CicloAplicacao[] {
  const ciclos: CicloAplicacao[] = [];
  const inicio = Date.parse("2026-05-04T07:00:00-03:00");
  for (let i = 0; i < 64; i++) {
    const m = maquinas[i % maquinas.length]!;
    const o = operadores[(i * 3 + Math.floor(i / 5)) % operadores.length]!;
    const op = operacoes[(i * 7 + Math.floor(i / 3)) % operacoes.length]!;
    const [fazendaId, talhaoId] = talhoes[(i * 5 + 1) % talhoes.length]!;
    const dia = inicio + Math.floor(i * 2.9) * 86400000 + Math.floor(rnd(i, 1) * 5) * 3600000;
    const hectares = r1(8 + rnd(i, 2) * 22);
    const esperado = hectares * op.vazao;
    const fator = 1 + m.vies + o.vies + (rnd(i, 3) - 0.5) * 0.12;
    const consumo = esperado * fator;
    const inicial = Math.min(m.tanqueL, Math.round(esperado * 0.7 / 50) * 50);
    const abastecimentos = [];
    let disponivel = inicial;
    let n = 0;
    while (disponivel < consumo + 40) {
      const v = Math.min(m.tanqueL, Math.round((consumo - disponivel + 150 + rnd(i, 10 + n) * 300) / 50) * 50);
      abastecimentos.push({ dataHora: new Date(dia + (2 + n) * 3600000).toISOString(), volumeL: v });
      disponivel += v;
      n++;
    }
    const devolucoes = i % 9 === 4 ? [{ dataHora: new Date(dia + 7 * 3600000).toISOString(), volumeL: 60 }] : [];
    const residual = r1(disponivel - consumo - devolucoes.reduce((s, d) => s + d.volumeL, 0));
    const ini = new Date(dia).toISOString();
    const fim = new Date(dia + (6 + n) * 3600000).toISOString();
    const semLeitura = i === 60 || i === 63;
    const c = {
      id: `cic-${String(i + 1).padStart(3, "0")}`,
      maquinaId: m.id, sensorId: m.sensorId, operador: o.nome, fazendaId, talhaoId,
      osCodigo: `OS-2026-${String(200 + Math.floor(i / 2)).padStart(4, "0")}`,
      operacao: op.op, produto: op.produto, concentracao: op.conc,
      safra: dia < Date.parse("2026-07-01") ? "2025/26" : "2026/27",
      inicio: ini, fim, volumeInicialL: inicial, abastecimentos, devolucoes,
      hectares: i === 57 ? 0 : hectares, vazaoPlanejadaLha: op.vazao,
    };
    const leituras = leiturasEstabilizacao(c, residual, i, !semLeitura);
    let volumeResidualL = residualEstavel(leituras, fim);
    if (i === 61) volumeResidualL = disponivel + 120; // leitura inconsistente simulada
    ciclos.push({ ...c, leituras, ...(volumeResidualL !== undefined ? { volumeResidualL } : {}) });
  }
  return ciclos;
}

export const ciclosDemo: CicloAplicacao[] = gerar();
export const maquinaNome = (id: string) => maquinas.find((m) => m.id === id)?.nome ?? id;
