export type ProductLineInput = { productId?: string | null; productName: string; unit?: string | null; product?: { code?: string | null } | null };
export const productCode = (line: ProductLineInput) => line.product?.code?.trim() || `LINE-${line.productId ?? Buffer.from(line.productName).toString('hex').slice(0, 24)}`;
export function buildProducts(lines: ProductLineInput[]) {
  const entries = lines.map((line) => ({ ProductType: line.unit === 'SERVICO' ? 'S' : 'P', ProductCode: productCode(line), ProductDescription: line.productName, ProductNumberCode: productCode(line) }));
  return [...new Map(entries.map((entry) => [entry.ProductCode, entry])).values()];
}
