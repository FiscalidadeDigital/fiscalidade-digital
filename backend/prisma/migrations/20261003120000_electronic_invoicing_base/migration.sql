CREATE TABLE "ElectronicInvoiceSubmission" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "submissionUuid" TEXT NOT NULL,
    "requestId" TEXT,
    "agtDocumentNo" TEXT,
    "environment" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "lastHttpStatus" INTEGER,
    "agtErrors" JSONB,
    "agtErrorHistory" JSONB,
    "lastAgtResponse" JSONB,
    "submittedAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ElectronicInvoiceSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectronicInvoiceSeries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "seriesCode" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "seriesYear" INTEGER NOT NULL,
    "establishmentNumber" TEXT NOT NULL,
    "contingencyIndicator" TEXT NOT NULL DEFAULT 'N',
    "authorizedQuantity" INTEGER,
    "firstDocumentNo" TEXT,
    "lastDocumentNo" TEXT,
    "environment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ElectronicInvoiceSeries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ElectronicInvoiceSubmission_invoiceId_environment_key" ON "ElectronicInvoiceSubmission"("invoiceId", "environment");
CREATE UNIQUE INDEX "ElectronicInvoiceSubmission_submissionUuid_key" ON "ElectronicInvoiceSubmission"("submissionUuid");
CREATE INDEX "ElectronicInvoiceSubmission_tenantId_status_idx" ON "ElectronicInvoiceSubmission"("tenantId", "status");
CREATE INDEX "ElectronicInvoiceSubmission_requestId_idx" ON "ElectronicInvoiceSubmission"("requestId");
CREATE UNIQUE INDEX "ElectronicInvoiceSeries_tenantId_seriesCode_environment_key" ON "ElectronicInvoiceSeries"("tenantId", "seriesCode", "environment");
CREATE INDEX "ElectronicInvoiceSeries_tenantId_documentType_seriesYear_idx" ON "ElectronicInvoiceSeries"("tenantId", "documentType", "seriesYear");
ALTER TABLE "ElectronicInvoiceSubmission" ADD CONSTRAINT "ElectronicInvoiceSubmission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectronicInvoiceSubmission" ADD CONSTRAINT "ElectronicInvoiceSubmission_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ElectronicInvoiceSeries" ADD CONSTRAINT "ElectronicInvoiceSeries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Explicit AGT operation classification. Nullable so historical catalogue and
-- invoice rows are preserved; electronic-invoicing preflight blocks omissions.
ALTER TABLE "Product" ADD COLUMN "electronicOperationType" TEXT;
ALTER TABLE "InvoiceItem" ADD COLUMN "electronicOperationType" TEXT;
