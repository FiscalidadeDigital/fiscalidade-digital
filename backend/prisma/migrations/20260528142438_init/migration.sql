/*
  Warnings:

  - The values [RETENCAO] on the enum `ObligationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `channel` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `recipient` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Notification` table. All the data in the column will be lost.
  - Added the required column `title` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ObligationType_new" AS ENUM ('IVA', 'IRT', 'II', 'SS', 'DECLARACAO');
ALTER TABLE "FiscalObligation" ALTER COLUMN "type" TYPE "ObligationType_new" USING ("type"::text::"ObligationType_new");
ALTER TYPE "ObligationType" RENAME TO "ObligationType_old";
ALTER TYPE "ObligationType_new" RENAME TO "ObligationType";
DROP TYPE "ObligationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_tenantId_fkey";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "channel",
DROP COLUMN "recipient",
DROP COLUMN "status",
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "title" TEXT NOT NULL;
