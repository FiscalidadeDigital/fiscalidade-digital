CREATE TYPE "PurchaseInvoiceImportStatus" AS ENUM (
  'UPLOADED', 'PROCESSING', 'REVIEW_REQUIRED', 'READY', 'CONFIRMED', 'FAILED'
);

CREATE TABLE "PurchaseInvoiceImport" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "status" "PurchaseInvoiceImportStatus" NOT NULL DEFAULT 'UPLOADED',
  "extractionProvider" TEXT NOT NULL DEFAULT 'MANUAL',
  "providerVersion" TEXT,
  "rawExtraction" JSONB,
  "candidateData" JSONB,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "confirmedPurchaseInvoiceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PurchaseInvoiceImport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PurchaseInvoiceImport_documentId_key" ON "PurchaseInvoiceImport"("documentId");
CREATE UNIQUE INDEX "PurchaseInvoiceImport_confirmedPurchaseInvoiceId_key" ON "PurchaseInvoiceImport"("confirmedPurchaseInvoiceId");
CREATE INDEX "PurchaseInvoiceImport_tenantId_status_idx" ON "PurchaseInvoiceImport"("tenantId", "status");
CREATE INDEX "PurchaseInvoiceImport_uploadedById_idx" ON "PurchaseInvoiceImport"("uploadedById");

ALTER TABLE "PurchaseInvoiceImport"
  ADD CONSTRAINT "PurchaseInvoiceImport_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PurchaseInvoiceImport_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "PurchaseInvoiceImport_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "PurchaseInvoiceImport_confirmedPurchaseInvoiceId_fkey"
    FOREIGN KEY ("confirmedPurchaseInvoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
