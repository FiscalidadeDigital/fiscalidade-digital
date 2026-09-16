-- CreateEnum
CREATE TYPE "TaxRuleOperation" AS ENUM ('PURCHASE', 'SALE', 'SERVICE', 'IMPORT', 'EXPORT', 'PAYROLL', 'OTHER');

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nif" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseInvoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "iva" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "withholdingTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "pdfUrl" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseInvoiceItem" (
    "id" TEXT NOT NULL,
    "purchaseInvoiceId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PurchaseInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxTransaction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "taxType" "TaxType" NOT NULL,
    "operation" "TaxRuleOperation" NOT NULL,
    "period" TEXT NOT NULL,
    "referenceDate" TIMESTAMP(3) NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "baseAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductibleAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "withheldAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxAssessment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "taxType" "TaxType" NOT NULL,
    "period" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "taxableAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxDueAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductibleAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "withheldAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adjustmentsAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "taxType" "TaxType" NOT NULL,
    "regime" "FiscalRegime",
    "operation" "TaxRuleOperation",
    "sector" TEXT,
    "companyType" TEXT,
    "rate" DECIMAL(10,6),
    "fixedAmount" DECIMAL(18,2),
    "minAmount" DECIMAL(18,2),
    "maxAmount" DECIMAL(18,2),
    "calculationBase" TEXT,
    "conditions" JSONB,
    "deductions" JSONB,
    "legalReference" TEXT,
    "legalArticle" TEXT,
    "officialSource" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Supplier_tenantId_idx" ON "Supplier"("tenantId");

-- CreateIndex
CREATE INDEX "Supplier_nif_idx" ON "Supplier"("nif");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_tenantId_idx" ON "PurchaseInvoice"("tenantId");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_supplierId_idx" ON "PurchaseInvoice"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_issuedAt_idx" ON "PurchaseInvoice"("issuedAt");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_status_idx" ON "PurchaseInvoice"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseInvoice_tenantId_invoiceNumber_key" ON "PurchaseInvoice"("tenantId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "PurchaseInvoiceItem_purchaseInvoiceId_idx" ON "PurchaseInvoiceItem"("purchaseInvoiceId");

-- CreateIndex
CREATE INDEX "PurchaseInvoiceItem_productId_idx" ON "PurchaseInvoiceItem"("productId");

-- CreateIndex
CREATE INDEX "TaxTransaction_tenantId_idx" ON "TaxTransaction"("tenantId");

-- CreateIndex
CREATE INDEX "TaxTransaction_taxType_idx" ON "TaxTransaction"("taxType");

-- CreateIndex
CREATE INDEX "TaxTransaction_operation_idx" ON "TaxTransaction"("operation");

-- CreateIndex
CREATE INDEX "TaxTransaction_period_idx" ON "TaxTransaction"("period");

-- CreateIndex
CREATE INDEX "TaxTransaction_referenceDate_idx" ON "TaxTransaction"("referenceDate");

-- CreateIndex
CREATE INDEX "TaxTransaction_sourceType_sourceId_idx" ON "TaxTransaction"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "TaxAssessment_tenantId_idx" ON "TaxAssessment"("tenantId");

-- CreateIndex
CREATE INDEX "TaxAssessment_taxType_idx" ON "TaxAssessment"("taxType");

-- CreateIndex
CREATE INDEX "TaxAssessment_period_year_idx" ON "TaxAssessment"("period", "year");

-- CreateIndex
CREATE INDEX "TaxAssessment_status_idx" ON "TaxAssessment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TaxAssessment_tenantId_taxType_period_year_key" ON "TaxAssessment"("tenantId", "taxType", "period", "year");

-- CreateIndex
CREATE INDEX "TaxRule_taxType_idx" ON "TaxRule"("taxType");

-- CreateIndex
CREATE INDEX "TaxRule_regime_idx" ON "TaxRule"("regime");

-- CreateIndex
CREATE INDEX "TaxRule_operation_idx" ON "TaxRule"("operation");

-- CreateIndex
CREATE INDEX "TaxRule_active_idx" ON "TaxRule"("active");

-- CreateIndex
CREATE INDEX "TaxRule_validFrom_validTo_idx" ON "TaxRule"("validFrom", "validTo");

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoiceItem" ADD CONSTRAINT "PurchaseInvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxTransaction" ADD CONSTRAINT "TaxTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxAssessment" ADD CONSTRAINT "TaxAssessment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
