CREATE TYPE "PurchaseInvoiceDocumentStatus" AS ENUM ('PENDING', 'REVIEW_REQUIRED', 'VALIDATED', 'REJECTED', 'CANCELLED');
CREATE TYPE "PurchaseInvoicePaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID');
CREATE TYPE "PurchaseInvoicePaymentMethod" AS ENUM ('BANK_TRANSFER', 'MULTICAIXA_TPA', 'CASH', 'OTHER');

ALTER TABLE "PurchaseInvoice"
ADD COLUMN "documentStatus" "PurchaseInvoiceDocumentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "paymentStatus" "PurchaseInvoicePaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN "paidAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
ADD COLUMN "validatedAt" TIMESTAMP(3),
ADD COLUMN "validatedById" TEXT,
ADD COLUMN "rejectedAt" TIMESTAMP(3),
ADD COLUMN "rejectedById" TEXT,
ADD COLUMN "rejectionReason" TEXT;

UPDATE "PurchaseInvoice"
SET "documentStatus" = CASE
  WHEN "status" = 'CANCELLED' THEN 'CANCELLED'::"PurchaseInvoiceDocumentStatus"
  ELSE 'PENDING'::"PurchaseInvoiceDocumentStatus"
END,
"paymentStatus" = CASE
  WHEN "status" = 'PAID' THEN 'PAID'::"PurchaseInvoicePaymentStatus"
  ELSE 'UNPAID'::"PurchaseInvoicePaymentStatus"
END,
"paidAmount" = CASE WHEN "status" = 'PAID' THEN COALESCE("totalAmount", "total"::DECIMAL) ELSE 0 END;

CREATE TABLE "PurchaseInvoicePayment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "purchaseInvoiceId" TEXT NOT NULL,
  "amount" DECIMAL(20,2) NOT NULL,
  "paymentDate" TIMESTAMP(3) NOT NULL,
  "method" "PurchaseInvoicePaymentMethod" NOT NULL,
  "reference" TEXT,
  "notes" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchaseInvoicePayment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PurchaseInvoice_tenantId_documentStatus_idx" ON "PurchaseInvoice"("tenantId", "documentStatus");
CREATE INDEX "PurchaseInvoice_tenantId_paymentStatus_idx" ON "PurchaseInvoice"("tenantId", "paymentStatus");
CREATE INDEX "PurchaseInvoicePayment_tenantId_purchaseInvoiceId_idx" ON "PurchaseInvoicePayment"("tenantId", "purchaseInvoiceId");
CREATE INDEX "PurchaseInvoicePayment_paymentDate_idx" ON "PurchaseInvoicePayment"("paymentDate");

ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseInvoicePayment" ADD CONSTRAINT "PurchaseInvoicePayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseInvoicePayment" ADD CONSTRAINT "PurchaseInvoicePayment_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseInvoicePayment" ADD CONSTRAINT "PurchaseInvoicePayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
