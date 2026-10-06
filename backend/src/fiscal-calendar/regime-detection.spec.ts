import { FiscalRegime } from "@prisma/client";
import { detectRegimes } from "./regime-detection";

describe("detectRegimes", () => {
  it("does not infer GERAL for an unknown designation", () => {
    expect(detectRegimes("Regime Geral", "Pagamento do imposto")).toEqual([]);
  });

  it("does not map Regime Especial to GERAL", () => {
    expect(detectRegimes("Regime Especial", "Imposto Industrial")).toEqual([]);
  });

  it("keeps explicit regime associations", () => {
    expect(detectRegimes("Regime Geral", "Regime Geral - imposto")).toEqual([
      FiscalRegime.GERAL,
    ]);
    expect(
      detectRegimes("Regime Geral", "Regime Simplificado - imposto"),
    ).toEqual([FiscalRegime.SIMPLIFICADO]);
  });
});
