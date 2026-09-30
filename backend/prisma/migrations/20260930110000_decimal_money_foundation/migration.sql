-- Fundação aditiva de precisão monetária. As colunas Float legadas permanecem
-- disponíveis durante a transição para evitar perda de compatibilidade.
ALTER TABLE "Product"
  ADD COLUMN "priceAmount" DECIMAL(20,2),
  ADD COLUMN "stockAmount" DECIMAL(20,4);

UPDATE "Product"
SET
  "priceAmount" = ROUND("price"::numeric, 2),
  "stockAmount" = CASE
    WHEN "stock" IS NULL THEN NULL
    ELSE ROUND("stock"::numeric, 4)
  END;

ALTER TABLE "Invoice"
  ADD COLUMN "subtotalAmount" DECIMAL(20,2),
  ADD COLUMN "ivaAmount" DECIMAL(20,2),
  ADD COLUMN "withholdingTaxAmount" DECIMAL(20,2),
  ADD COLUMN "totalAmount" DECIMAL(20,2),
  ADD COLUMN "taxRuleVersion" TEXT,
  ADD COLUMN "taxCalculationStatus" TEXT NOT NULL DEFAULT 'LEGACY_UNVERIFIED';

UPDATE "Invoice"
SET
  "subtotalAmount" = ROUND("subtotal"::numeric, 2),
  "ivaAmount" = ROUND("iva"::numeric, 2),
  "withholdingTaxAmount" = ROUND("withholdingTax"::numeric, 2),
  "totalAmount" = ROUND("total"::numeric, 2);

ALTER TABLE "InvoiceItem"
  ADD COLUMN "quantityAmount" DECIMAL(20,4),
  ADD COLUMN "unitPriceAmount" DECIMAL(20,2),
  ADD COLUMN "totalAmount" DECIMAL(20,2),
  ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'UN';

UPDATE "InvoiceItem"
SET
  "quantityAmount" = ROUND("quantity"::numeric, 4),
  "unitPriceAmount" = ROUND("unitPrice"::numeric, 2),
  "totalAmount" = ROUND("total"::numeric, 2);
