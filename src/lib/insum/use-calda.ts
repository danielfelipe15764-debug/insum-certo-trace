import { useEffect, useMemo, useState } from "react";
import { calcularCiclo, desvioPonderado, gerarAlerta, toleranciaDe, type CicloAplicacao, type ResultadoCiclo, type Tolerancias } from "./calda";
import { ciclosDemo, TOLERANCIAS_PADRAO } from "./calda-seed";

const KEY = "insumcerto:calda-tol:v1";

export interface LinhaCiclo {
  c: CicloAplicacao;
  r: ResultadoCiclo;
  tol: number;
}

export function useCalda() {
  const [tolerancias, setTol] = useState<Tolerancias>(TOLERANCIAS_PADRAO);
  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s) setTol({ ...TOLERANCIAS_PADRAO, ...JSON.parse(s) });
    } catch {
      /* ignora */
    }
  }, []);
  const salvarTolerancias = (t: Tolerancias) => {
    setTol(t);
    localStorage.setItem(KEY, JSON.stringify(t));
  };
  const linhas = useMemo<LinhaCiclo[]>(
    () => ciclosDemo.map((c) => ({ c, r: calcularCiclo(c, tolerancias), tol: toleranciaDe(c, tolerancias) })),
    [tolerancias],
  );
  const alertas = useMemo(
    () => linhas.flatMap(({ c, r }) => gerarAlerta(c, r) ?? []).sort((a, b) => b.dataHora.localeCompare(a.dataHora)),
    [linhas],
  );
  return { linhas, alertas, tolerancias, salvarTolerancias };
}

export const valida = (l: LinhaCiclo) => l.r.classe === "dentro" || l.r.classe === "acima" || l.r.classe === "abaixo";

export interface Agregado {
  chave: string;
  n: number;
  ha: number;
  esperado: number;
  real: number;
  desvioL: number;
  pct: number;
  vazaoPlan: number;
  vazaoReal: number;
  extra: Set<string>;
}

/** Consolida com desvio ponderado pelo consumo planejado. */
export function agrupar(linhas: LinhaCiclo[], chave: (l: LinhaCiclo) => string, extra?: (l: LinhaCiclo) => string): Agregado[] {
  const m = new Map<string, LinhaCiclo[]>();
  linhas.filter(valida).forEach((l) => m.set(chave(l), [...(m.get(chave(l)) ?? []), l]));
  return [...m.entries()]
    .map(([k, ls]) => {
      const ha = ls.reduce((s, l) => s + l.c.hectares, 0);
      const esperado = ls.reduce((s, l) => s + l.r.consumoEsperadoL, 0);
      const real = ls.reduce((s, l) => s + l.r.consumoRealL, 0);
      return {
        chave: k,
        n: ls.length,
        ha,
        esperado,
        real,
        desvioL: real - esperado,
        pct: desvioPonderado(ls.map((l) => l.r)),
        vazaoPlan: esperado / ha,
        vazaoReal: real / ha,
        extra: new Set(extra ? ls.map(extra) : []),
      };
    })
    .sort((a, b) => b.pct - a.pct);
}

export const fmtN = (v: number, d = 0) => v.toLocaleString("pt-BR", { maximumFractionDigits: d, minimumFractionDigits: d });
export const fmtPct = (v: number) => `${v > 0 ? "+" : ""}${fmtN(v, 1)}%`;
export const fmtDataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
export const mesDe = (iso: string) => iso.slice(0, 7);
