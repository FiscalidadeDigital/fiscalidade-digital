-- CreateEnum
CREATE TYPE "FiscalRegime" AS ENUM ('GERAL', 'SIMPLIFICADO', 'MICRO');

-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('IVA', 'IRT', 'INDUSTRIAL', 'SELO', 'SS');

-- CreateEnum
CREATE TYPE "DeclarationStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'LATE');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "regime" "FiscalRegime" NOT NULL DEFAULT 'GERAL';

-- CreateTable
CREATE TABLE "Revenue" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Revenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDeclaration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "taxType" "TaxType" NOT NULL,
    "period" TEXT NOT NULL,
    "declaredAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "DeclarationStatus" NOT NULL DEFAULT 'PENDING',
    "declarationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentDate" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "TaxDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxPayment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "declarationId" TEXT,
    "taxType" "TaxType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reference" TEXT,
    "paymentMethod" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxPayment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Revenue" ADD CONSTRAINT "Revenue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDeclaration" ADD CONSTRAINT "TaxDeclaration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxPayment" ADD CONSTRAINT "TaxPayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
