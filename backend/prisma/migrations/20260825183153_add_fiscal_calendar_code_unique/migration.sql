/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `FiscalCalendar` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ObligationType" ADD VALUE 'IEC';
ALTER TYPE "ObligationType" ADD VALUE 'IAC';
ALTER TYPE "ObligationType" ADD VALUE 'IP';
ALTER TYPE "ObligationType" ADD VALUE 'IVM';
ALTER TYPE "ObligationType" ADD VALUE 'IEJ';
ALTER TYPE "ObligationType" ADD VALUE 'IS';
ALTER TYPE "ObligationType" ADD VALUE 'CEOC';
ALTER TYPE "ObligationType" ADD VALUE 'IRP';
ALTER TYPE "ObligationType" ADD VALUE 'RCN';
ALTER TYPE "ObligationType" ADD VALUE 'TS';
ALTER TYPE "ObligationType" ADD VALUE 'CFQA';
ALTER TYPE "ObligationType" ADD VALUE 'ITP';
ALTER TYPE "ObligationType" ADD VALUE 'IPP';
ALTER TYPE "ObligationType" ADD VALUE 'IVRM';
ALTER TYPE "ObligationType" ADD VALUE 'PAGAMENTO';
ALTER TYPE "ObligationType" ADD VALUE 'RETENCAO';
ALTER TYPE "ObligationType" ADD VALUE 'SAFT';
ALTER TYPE "ObligationType" ADD VALUE 'OUTRA';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TaxType" ADD VALUE 'IEC';
ALTER TYPE "TaxType" ADD VALUE 'II';
ALTER TYPE "TaxType" ADD VALUE 'IAC';
ALTER TYPE "TaxType" ADD VALUE 'IP';
ALTER TYPE "TaxType" ADD VALUE 'IVM';
ALTER TYPE "TaxType" ADD VALUE 'IEJ';
ALTER TYPE "TaxType" ADD VALUE 'IS';
ALTER TYPE "TaxType" ADD VALUE 'CEOC';
ALTER TYPE "TaxType" ADD VALUE 'IRP';
ALTER TYPE "TaxType" ADD VALUE 'RCN';
ALTER TYPE "TaxType" ADD VALUE 'TS';
ALTER TYPE "TaxType" ADD VALUE 'CFQA';
ALTER TYPE "TaxType" ADD VALUE 'ITP';
ALTER TYPE "TaxType" ADD VALUE 'IPP';
ALTER TYPE "TaxType" ADD VALUE 'IVRM';
ALTER TYPE "TaxType" ADD VALUE 'TAXA_GAS';

-- DropIndex
DROP INDEX "FiscalCalendar_code_idx";

-- CreateIndex
CREATE UNIQUE INDEX "FiscalCalendar_code_key" ON "FiscalCalendar"("code");
