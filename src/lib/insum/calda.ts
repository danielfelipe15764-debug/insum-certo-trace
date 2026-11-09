/**
 * Monitoramento de calda (produtos líquidos).
 * Estrutura preparada para receber leituras reais de sensores de nível e hectares do Solinftec;
 * nesta versão todos os dados são demonstrativos (ver calda-seed.ts).
 */

export type StatusSensor = "estavel" | "instavel" | "sem_leitura";

/** Leitura bruta enviada pelo sensor de nível do tanque. */
export interface LeituraSensor {
  sensorId: string;
  maquinaId: string;
  cicloId: string;
  volumeL: number;
  dataHora: string;
  estabilidade: StatusSensor;
}

export interface MovimentoTanque {
  dataHora: string;
  volumeL: number;
}

export interface CicloAplicacao {
  id: string;
  maquinaId: string;
  sensorId: string;
  operador: string;
  fazendaId: string;
  talhaoId: string;
  osCodigo: string;
  operacao: string;
  produto: string;
  /** Concentração da calda — só se compara produto+concentração iguais */
  concentracao: string;
  safra: string;
  inicio: string;
  fim: string;
  volumeInicialL: number;
  abastecimentos: MovimentoTanque[];
  devolucoes: MovimentoTanque[];
  /** Residual estável registrado pelo sensor; undefined = leitura pendente */
  volumeResidualL?: number;
  /** Hectares efetivamente aplicados (Solinftec) */
  hectares: number;
  vazaoPlanejadaLha: number;
  leituras: LeituraSensor[];
}

export type ClasseConsumo = "dentro" | "acima" | "abaixo" | "pendente" | "inconsistente";

export interface ResultadoCiclo {
  consumoRealL: number;
  consumoEsperadoL: number;
  vazaoRealLha: number;
  /** ((real - esperado) / esperado) * 100 */
  desvioPct: number;
  desvioL: number;
  classe: ClasseConsumo;
  motivo?: string;
}

/** Tolerância (%) para cima e para baixo. */
export type Tolerancias = Record<string, number>;
export const TOLERANCIA_PADRAO = 5;

export const JANELA_ESTABILIZACAO_MIN = 3;
/** Variação máxima (L) entre leituras consecutivas para considerar o nível estável. */
export const VARIACAO_ESTAVEL_L = 1.5;

/** Retorna o volume residual se as leituras da janela final estiverem estáveis. */
export function residualEstavel(leituras: LeituraSensor[], fim: string): number | undefined {
  const limite = new Date(fim).getTime();
  const janela = leituras.filter((l) => {
    const t = new Date(l.dataHora).getTime();
    return t >= limite && t <= limite + JANELA_ESTABILIZACAO_MIN * 60000 && l.estabilidade !== "sem_leitura";
  });
  if (janela.length < 3) return undefined;
  const ultimas = janela.slice(-3);
  const vs = ultimas.map((l) => l.volumeL);
  if (Math.max(...vs) - Math.min(...vs) > VARIACAO_ESTAVEL_L) return undefined;
  return Math.round((vs.reduce((s, v) => s + v, 0) / vs.length) * 10) / 10;
}

const soma = (m: MovimentoTanque[]) => m.reduce((s, x) => s + x.volumeL, 0);

/** Consumo = inicial + abastecimentos − residual − devoluções/retiradas. */
export function consumoReal(c: Pick<CicloAplicacao, "volumeInicialL" | "abastecimentos" | "devolucoes">, residual: number) {
  return c.volumeInicialL + soma(c.abastecimentos) - residual - soma(c.devolucoes);
}

export function toleranciaDe(c: Pick<CicloAplicacao, "operacao" | "produto">, tol: Tolerancias) {
  return tol[`${c.operacao}|${c.produto}`] ?? tol[c.operacao] ?? TOLERANCIA_PADRAO;
}

export function calcularCiclo(c: CicloAplicacao, tol: Tolerancias = {}): ResultadoCiclo {
  const consumoEsperadoL = c.hectares * c.vazaoPlanejadaLha;
  const base = { consumoEsperadoL, consumoRealL: 0, vazaoRealLha: 0, desvioPct: 0, desvioL: 0 };
  const residual = c.volumeResidualL;
  if (residual === undefined) return { ...base, classe: "pendente", motivo: "Sensor sem leitura estável" };
  const disponivel = c.volumeInicialL + soma(c.abastecimentos);
  if (residual > disponivel) return { ...base, classe: "inconsistente", motivo: "Volume residual maior que o abastecido" };
  const consumoRealL = consumoReal(c, residual);
  if (consumoRealL < 0) return { ...base, classe: "inconsistente", motivo: "Devoluções maiores que o consumo" };
  if (c.hectares <= 0 && consumoRealL > 0)
    return { ...base, consumoRealL, classe: "inconsistente", motivo: "Consumo registrado sem hectares correspondentes" };
  if (c.hectares > 0 && consumoRealL <= 0)
    return { ...base, classe: "inconsistente", motivo: "Área aplicada sem registro de consumo" };
  const desvioL = consumoRealL - consumoEsperadoL;
  const desvioPct = (desvioL / consumoEsperadoL) * 100;
  const t = toleranciaDe(c, tol);
  const classe: ClasseConsumo = desvioPct > t ? "acima" : desvioPct < -t ? "abaixo" : "dentro";
  return { consumoRealL, consumoEsperadoL, vazaoRealLha: consumoRealL / c.hectares, desvioPct, desvioL, classe };
}

/** Desvio % ponderado pelo consumo planejado: Σ(real−esperado) / Σesperado. */
export function desvioPonderado(itens: { consumoRealL: number; consumoEsperadoL: number }[]) {
  const esp = itens.reduce((s, i) => s + i.consumoEsperadoL, 0);
  const real = itens.reduce((s, i) => s + i.consumoRealL, 0);
  return esp ? ((real - esp) / esp) * 100 : 0;
}

export type FaixaCalor = "verde" | "amarelo" | "vermelho";
/** Mapa de calor: até a tolerância = verde, até 2× = amarelo, acima = vermelho. */
export function faixaCalor(desvioPct: number, tolerancia = TOLERANCIA_PADRAO): FaixaCalor {
  const a = Math.abs(desvioPct);
  if (a <= tolerancia) return "verde";
  if (a <= tolerancia * 2) return "amarelo";
  return "vermelho";
}
export const corCalor: Record<FaixaCalor, string> = { verde: "#2f8a52", amarelo: "#d9a520", vermelho: "#c8382f" };

export const classeLabel: Record<ClasseConsumo, string> = {
  dentro: "Dentro do planejado",
  acima: "Acima do planejado",
  abaixo: "Abaixo do planejado",
  pendente: "Leitura pendente",
  inconsistente: "Dados inconsistentes",
};

export type TipoAlerta = "acima" | "abaixo" | "sem_leitura" | "residual_inconsistente" | "area_sem_consumo" | "consumo_sem_area";
export interface AlertaCalda {
  id: string;
  cicloId: string;
  tipo: TipoAlerta;
  dataHora: string;
  mensagem: string;
}
export const alertaLabel: Record<TipoAlerta, string> = {
  acima: "Consumo acima da tolerância",
  abaixo: "Consumo abaixo da recomendação",
  sem_leitura: "Sensor sem leitura",
  residual_inconsistente: "Volume residual inconsistente",
  area_sem_consumo: "Área aplicada sem consumo",
  consumo_sem_area: "Consumo sem hectares",
};

export function gerarAlerta(c: CicloAplicacao, r: ResultadoCiclo): AlertaCalda | null {
  const tipo: TipoAlerta | null =
    r.classe === "acima"
      ? "acima"
      : r.classe === "abaixo"
        ? "abaixo"
        : r.classe === "pendente"
          ? "sem_leitura"
          : r.classe === "inconsistente"
            ? r.motivo?.includes("sem hectares")
              ? "consumo_sem_area"
              : r.motivo?.includes("Área")
                ? "area_sem_consumo"
                : "residual_inconsistente"
            : null;
  if (!tipo) return null;
  const msg =
    tipo === "acima" || tipo === "abaixo"
      ? `${r.desvioPct > 0 ? "+" : ""}${r.desvioPct.toFixed(1)}% (${Math.round(r.consumoRealL)} L reais × ${Math.round(r.consumoEsperadoL)} L esperados)`
      : (r.motivo ?? "");
  return { id: `alt-${c.id}`, cicloId: c.id, tipo, dataHora: c.fim, mensagem: msg };
}
