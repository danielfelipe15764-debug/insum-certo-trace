import { describe, expect, it } from "vitest";
import { calcularEstouro, faixaEstouro } from "./estouro";

describe("calcularEstouro", () => {
  it("recomendado 10 L e aplicado 12 L dá +20%", () => {
    expect(calcularEstouro({ quantidade: 10, quantidadeAplicada: 12 })?.percentual).toBeCloseTo(20);
  });
  it("aplicado menor que o recomendado é subaplicação negativa", () => {
    expect(calcularEstouro({ quantidade: 100, quantidadeAplicada: 90 })?.percentual).toBeCloseTo(-10);
  });
  it("excedente é o volume acima do recomendado", () => {
    expect(calcularEstouro({ quantidade: 10, quantidadeAplicada: 12 })?.excedente).toBe(2);
  });
  it("sem aplicação não há estouro", () => {
    expect(calcularEstouro({ quantidade: 10 })).toBeNull();
  });
});

describe("faixaEstouro (padrão 5% / 15%)", () => {
  it("até 5% é dentro do padrão", () => expect(faixaEstouro(5)).toBe("padrao"));
  it("entre 5% e 15% é atenção", () => expect(faixaEstouro(8)).toBe("atencao"));
  it("acima de 15% é crítico", () => expect(faixaEstouro(20)).toBe("critico"));
  it("respeita limites configurados", () =>
    expect(faixaEstouro(8, { limiteAtencao: 10, limiteCritico: 20 })).toBe("padrao"));
});
