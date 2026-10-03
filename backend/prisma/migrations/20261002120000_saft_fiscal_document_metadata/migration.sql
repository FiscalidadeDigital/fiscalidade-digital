ALTER TABLE "Invoice"
ADD COLUMN "fiscalDocumentType" TEXT DEFAULT 'FT',
ADD COLUMN "fiscalSeries" TEXT,
ADD COLUMN "fiscalSequence" INTEGER,
ADD COLUMN "fiscalYear" INTEGER,
ADD COLUMN "cancellationReason" TEXT,
ADD COLUMN "rectifiesInvoiceId" TEXT,
ADD COLUMN "fiscalHash" TEXT,
ADD COLUMN "fiscalHashControl" TEXT,
ADD COLUMN "signatureKeyVersion" INTEGER,
ADD COLUMN "previousFiscalHash" TEXT;

ALTER TABLE "InvoiceItem"
ADD COLUMN "taxType" TEXT,
ADD COLUMN "taxCode" TEXT,
ADD COLUMN "taxRate" DECIMAL(10,6),
ADD COLUMN "taxAmount" DECIMAL(20,2),
ADD COLUMN "taxExemptionCode" TEXT,
ADD COLUMN "taxExemptionReason" TEXT;

ALTER TABLE "Tenant"
ADD COLUMN "city" TEXT,
ADD COLUMN "country" TEXT DEFAULT 'AO';

ALTER TABLE "Client"
ADD COLUMN "city" TEXT,
ADD COLUMN "country" TEXT DEFAULT 'AO';

CREATE INDEX "Invoice_tenantId_fiscalYear_fiscalSeries_fiscalSequence_idx"
ON "Invoice"("tenantId", "fiscalYear", "fiscalSeries", "fiscalSequence");

CREATE INDEX "Invoice_tenantId_fiscalDocumentType_fiscalSeries_fiscalYear_fiscalSequence_idx"
ON "Invoice"("tenantId", "fiscalDocumentType", "fiscalSeries", "fiscalYear", "fiscalSequence");
