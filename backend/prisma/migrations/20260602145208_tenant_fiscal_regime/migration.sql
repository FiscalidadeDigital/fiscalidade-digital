/*
  Warnings:

  - The values [MICRO] on the enum `FiscalRegime` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FiscalRegime_new" AS ENUM ('GERAL', 'SIMPLIFICADO', 'PRESTADOR_SERVICO');
ALTER TABLE "public"."Tenant" ALTER COLUMN "regime" DROP DEFAULT;
ALTER TABLE "Tenant" ALTER COLUMN "regime" TYPE "FiscalRegime_new" USING ("regime"::text::"FiscalRegime_new");
ALTER TYPE "FiscalRegime" RENAME TO "FiscalRegime_old";
ALTER TYPE "FiscalRegime_new" RENAME TO "FiscalRegime";
DROP TYPE "public"."FiscalRegime_old";
ALTER TABLE "Tenant" ALTER COLUMN "regime" SET DEFAULT 'GERAL';
COMMIT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "companyType" TEXT,
ADD COLUMN     "employees" INTEGER,
ADD COLUMN     "retentionRate" DOUBLE PRECISION NOT NULL DEFAULT 0;
