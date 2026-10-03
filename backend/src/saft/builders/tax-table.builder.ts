export type TaxLineInput = { taxType?: string | null; taxCode?: string | null; taxRate?: { toString(): string } | null };
export function buildTaxTable(lines: TaxLineInput[]) {
  const entries = lines.filter((line) => line.taxType && line.taxCode && line.taxRate != null).map((line) => ({
    TaxType: line.taxType!, TaxCountryRegion: 'AO', TaxCode: line.taxCode!, Description: `${line.taxType} ${line.taxCode}`,
    TaxPercentage: line.taxRate!.toString(),
  }));
  return [...new Map(entries.map((entry) => [`${entry.TaxType}:${entry.TaxCode}:${entry.TaxPercentage}`, entry])).values()];
}
