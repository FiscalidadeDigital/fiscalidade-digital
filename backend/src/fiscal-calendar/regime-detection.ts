import { FiscalRegime } from "@prisma/client";

export function detectRegimes(
  sheetName: string,
  designation: string,
): FiscalRegime[] {
  const sheet = sheetName.trim().toUpperCase();
  const text = designation.trim().toUpperCase();
  const hasSimplified = text.includes("REGIME SIMPLIFICADO");
  const hasGeneral = text.includes("REGIME GERAL");
  const hasBoth =
    text.includes("GERAL E SIMPLIFICADO") ||
    text.includes("SIMPLIFICADO E GERAL");

  if (sheet.includes("REGIME ESPECIAL")) {
    return [];
  }

  if (hasBoth || (hasSimplified && hasGeneral)) {
    return [FiscalRegime.GERAL, FiscalRegime.SIMPLIFICADO];
  }

  if (hasSimplified) {
    return [FiscalRegime.SIMPLIFICADO];
  }

  if (hasGeneral) {
    return [FiscalRegime.GERAL];
  }

  return [];
}
