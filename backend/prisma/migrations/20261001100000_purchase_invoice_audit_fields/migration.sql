ALTER TABLE "PurchaseInvoice"
  ADD COLUMN "subtotalAmount" DECIMAL(20,2),
  ADD COLUMN "ivaAmount" DECIMAL(20,2),
  ADD COLUMN "withholdingTaxAmount" DECIMAL(20,2),
  ADD COLUMN "totalAmount" DECIMAL(20,2),
  ADD COLUMN "currency" VARCHAR(3) NOT NULL DEFAULT 'AOA',
  ADD COLUMN "reference" TEXT,
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "originalDocumentId" TEXT;

ALTER TABLE "PurchaseInvoiceItem"
  ADD COLUMN "quantityAmount" DECIMAL(20,4),
  ADD COLUMN "unitPriceAmount" DECIMAL(20,2),
  ADD COLUMN "totalAmount" DECIMAL(20,2),
  ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'UN';

CREATE UNIQUE INDEX "PurchaseInvoice_originalDocumentId_key" ON "PurchaseInvoice"("originalDocumentId");
CREATE INDEX "PurchaseInvoice_createdById_idx" ON "PurchaseInvoice"("createdById");

ALTER TABLE "PurchaseInvoice"
  ADD CONSTRAINT "PurchaseInvoice_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "PurchaseInvoice_originalDocumentId_fkey"
  FOREIGN KEY ("originalDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
