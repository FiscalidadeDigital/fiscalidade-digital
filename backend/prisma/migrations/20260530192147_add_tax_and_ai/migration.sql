-- CreateTable
CREATE TABLE "TaxCalculation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "taxType" TEXT NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,
    "expenses" DOUBLE PRECISION,
    "taxableAmount" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "period" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIQuestion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIQuestion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TaxCalculation" ADD CONSTRAINT "TaxCalculation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIQuestion" ADD CONSTRAINT "AIQuestion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
