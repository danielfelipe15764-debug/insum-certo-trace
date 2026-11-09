import { describe, expect, it } from "vitest";
import { calcularCiclo, desvioPonderado, residualEstavel, type CicloAplicacao } from "./calda";

const base: CicloAplicacao = {
  id: "c", maquinaId: "m", sensorId: "s", operador: "o", fazendaId: "f", talhaoId: "t", osCodigo: "OS",
  operacao: "Herbicida", produto: "P", concentracao: "1%", safra: "26/27", inicio: "2026-10-01T10:00:00Z",
  fim: "2026-10-01T11:00:00Z", volumeInicialL: 300, abastecimentos: [], devolucoes: [], volumeResidualL: 0,
  hectares: 2.5, vazaoPlanejadaLha: 100, leituras: [],
};

describe("calcularCiclo", () => {
  it("exemplo: 300 L, 2,5 ha a 100 L/ha dá +20% e 120 L/ha", () => {
    const r = calcularCiclo(base);
    expect(r.consumoRealL).toBe(300);
    expect(r.consumoEsperadoL).toBe(250);
    expect(r.vazaoRealLha).toBe(120);
    expect(r.desvioPct).toBeCloseTo(20);
    expect(r.classe).toBe("acima");
  });
  it("soma abastecimentos e desconta devoluções", () => {
    const r = calcularCiclo({ ...base, abastecimentos: [{ dataHora: "", volumeL: 200 }], devolucoes: [{ dataHora: "", volumeL: 50 }], volumeResidualL: 200 });
    expect(r.consumoRealL).toBe(250);
    expect(r.classe).toBe("dentro");
  });
  it("sem residual estável fica pendente", () => expect(calcularCiclo({ ...base, volumeResidualL: undefined }).classe).toBe("pendente"));
  it("residual maior que o abastecido é inconsistente", () => expect(calcularCiclo({ ...base, volumeResidualL: 400 }).classe).toBe("inconsistente"));
  it("respeita tolerância por operação", () => expect(calcularCiclo(base, { Herbicida: 25 }).classe).toBe("dentro"));
});

describe("desvioPonderado", () => {
  it("pondera pelo planejado, não média simples", () => {
    // +100% em 10 L e 0% em 990 L => 1%
    expect(desvioPonderado([{ consumoEsperadoL: 10, consumoRealL: 20 }, { consumoEsperadoL: 990, consumoRealL: 990 }])).toBeCloseTo(1);
  });
});

describe("residualEstavel", () => {
  const l = (min: number, v: number) => ({ sensorId: "s", maquinaId: "m", cicloId: "c", volumeL: v, dataHora: new Date(Date.parse(base.fim) + min * 60000).toISOString(), estabilidade: "estavel" as const });
  it("leituras estáveis na janela de 3 min geram residual", () => expect(residualEstavel([l(0.5, 20), l(1.5, 18.2), l(2, 18), l(2.5, 18.4)], base.fim)).toBeCloseTo(18.2));
  it("leituras oscilando não geram residual", () => expect(residualEstavel([l(1, 20), l(2, 12), l(2.5, 25)], base.fim)).toBeUndefined());
});
