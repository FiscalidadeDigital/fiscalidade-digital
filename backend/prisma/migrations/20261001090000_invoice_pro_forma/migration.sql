CREATE TYPE "InvoiceDocumentType" AS ENUM ('NORMAL', 'PRO_FORMA');

ALTER TABLE "Invoice"
  ADD COLUMN "documentType" "InvoiceDocumentType" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN "sourceProFormaId" TEXT;

CREATE UNIQUE INDEX "Invoice_sourceProFormaId_key" ON "Invoice"("sourceProFormaId");
CREATE INDEX "Invoice_tenantId_documentType_idx" ON "Invoice"("tenantId", "documentType");

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_sourceProFormaId_fkey"
  FOREIGN KEY ("sourceProFormaId") REFERENCES "Invoice"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
