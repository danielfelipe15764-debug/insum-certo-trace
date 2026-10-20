import type { ConfigEstouro, Insumo } from "./types";

export type FaixaEstouro = "padrao" | "atencao" | "critico";

export interface Estouro {
  recomendado: number;
  aplicado: number;
  /** ((aplicado - recomendado) / recomendado) * 100 — negativo = subaplicação */
  percentual: number;
  /** Volume aplicado acima do recomendado (0 se subaplicação) */
  excedente: number;
}

export const CONFIG_ESTOURO_PADRAO: ConfigEstouro = { limiteAtencao: 5, limiteCritico: 15 };

/** Função única de cálculo de estouro usada em todas as telas. */
export function calcularEstouro(insumo: Pick<Insumo, "quantidade" | "quantidadeAplicada">): Estouro | null {
  const recomendado = insumo.quantidade;
  const aplicado = insumo.quantidadeAplicada;
  if (aplicado === undefined || !recomendado) return null;
  const percentual = ((aplicado - recomendado) / recomendado) * 100;
  return { recomendado, aplicado, percentual, excedente: Math.max(0, aplicado - recomendado) };
}

/** Classifica pelo desvio absoluto: até limiteAtencao = padrão, até limiteCritico = atenção, acima = crítico. */
export function faixaEstouro(percentual: number, cfg: ConfigEstouro = CONFIG_ESTOURO_PADRAO): FaixaEstouro {
  const a = Math.abs(percentual);
  if (a <= cfg.limiteAtencao) return "padrao";
  if (a <= cfg.limiteCritico) return "atencao";
  return "critico";
}

export function fmtEstouro(percentual: number) {
  const v = percentual.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  return percentual > 0 ? `+${v}%` : `${v}%`;
}

export const faixaLabel: Record<FaixaEstouro, string> = {
  padrao: "Dentro do padrão",
  atencao: "Atenção",
  critico: "Crítico",
};

/** Cor CSS (token) por faixa, para gráficos e mapas. */
export const faixaCor: Record<FaixaEstouro, string> = {
  padrao: "var(--success)",
  atencao: "var(--warning)",
  critico: "var(--destructive)",
};

/** Cor hex equivalente, para PDF e marcadores de mapa fora do DOM. */
export const faixaHex: Record<FaixaEstouro, string> = {
  padrao: "#2f8a52",
  atencao: "#d9a520",
  critico: "#c8382f",
};
