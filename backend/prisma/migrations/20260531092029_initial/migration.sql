/*
  Warnings:

  - You are about to drop the column `expenses` on the `TaxCalculation` table. All the data in the column will be lost.
  - You are about to drop the column `period` on the `TaxCalculation` table. All the data in the column will be lost.
  - You are about to drop the column `revenue` on the `TaxCalculation` table. All the data in the column will be lost.
  - You are about to drop the column `taxAmount` on the `TaxCalculation` table. All the data in the column will be lost.
  - You are about to drop the column `taxableAmount` on the `TaxCalculation` table. All the data in the column will be lost.
  - Added the required column `amount` to the `TaxCalculation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rate` to the `TaxCalculation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tax` to the `TaxCalculation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `TaxCalculation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TaxCalculation" DROP COLUMN "expenses",
DROP COLUMN "period",
DROP COLUMN "revenue",
DROP COLUMN "taxAmount",
DROP COLUMN "taxableAmount",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "rate" TEXT NOT NULL,
ADD COLUMN     "tax" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL;
