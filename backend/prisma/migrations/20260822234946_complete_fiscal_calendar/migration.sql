/*
  Warnings:

  - Added the required column `obligationType` to the `FiscalCalendar` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referenceYear` to the `FiscalCalendar` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `FiscalCalendar` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LegislationCategory" AS ENUM ('LEI', 'DECRETO', 'DECRETO_PRESIDENCIAL', 'DECRETO_EXECUTIVO', 'DESPACHO', 'INSTRUTIVO', 'AVISO', 'CIRCULAR', 'REGULAMENTO', 'OUTROS');

-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN     "fiscalAlertDaysBefore" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "fiscalAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "fiscalDueDateReminder" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "fiscalReminderEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "FiscalCalendar" ADD COLUMN     "code" TEXT,
ADD COLUMN     "obligationType" "ObligationType" NOT NULL,
ADD COLUMN     "officialReference" TEXT,
ADD COLUMN     "period" TEXT,
ADD COLUMN     "referenceYear" INTEGER NOT NULL,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "FiscalObligation" ADD COLUMN     "alertDaysBefore" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "alertEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "fiscalCalendarId" TEXT,
ADD COLUMN     "lastReminderAt" TIMESTAMP(3),
ADD COLUMN     "period" TEXT,
ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "FiscalCalendarRegime" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "regime" "FiscalRegime" NOT NULL,

    CONSTRAINT "FiscalCalendarRegime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Legislation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "taxType" "TaxType" NOT NULL,
    "category" "LegislationCategory" NOT NULL DEFAULT 'OUTROS',
    "description" TEXT,
    "content" TEXT,
    "lawNumber" TEXT,
    "article" TEXT,
    "source" TEXT,
    "sourceUrl" TEXT,
    "publicationDate" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Legislation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FiscalCalendarRegime_regime_idx" ON "FiscalCalendarRegime"("regime");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalCalendarRegime_calendarId_regime_key" ON "FiscalCalendarRegime"("calendarId", "regime");

-- CreateIndex
CREATE INDEX "Legislation_taxType_idx" ON "Legislation"("taxType");

-- CreateIndex
CREATE INDEX "Legislation_category_idx" ON "Legislation"("category");

-- CreateIndex
CREATE INDEX "Legislation_active_idx" ON "Legislation"("active");

-- CreateIndex
CREATE INDEX "Legislation_publicationDate_idx" ON "Legislation"("publicationDate");

-- CreateIndex
CREATE INDEX "AIQuestion_tenantId_idx" ON "AIQuestion"("tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "EmailLog_tenantId_idx" ON "EmailLog"("tenantId");

-- CreateIndex
CREATE INDEX "FiscalCalendar_taxType_idx" ON "FiscalCalendar"("taxType");

-- CreateIndex
CREATE INDEX "FiscalCalendar_obligationType_idx" ON "FiscalCalendar"("obligationType");

-- CreateIndex
CREATE INDEX "FiscalCalendar_referenceYear_idx" ON "FiscalCalendar"("referenceYear");

-- CreateIndex
CREATE INDEX "FiscalCalendar_dueDate_idx" ON "FiscalCalendar"("dueDate");

-- CreateIndex
CREATE INDEX "FiscalCalendar_active_idx" ON "FiscalCalendar"("active");

-- CreateIndex
CREATE INDEX "FiscalCalendar_code_idx" ON "FiscalCalendar"("code");

-- CreateIndex
CREATE INDEX "FiscalObligation_tenantId_idx" ON "FiscalObligation"("tenantId");

-- CreateIndex
CREATE INDEX "FiscalObligation_fiscalCalendarId_idx" ON "FiscalObligation"("fiscalCalendarId");

-- CreateIndex
CREATE INDEX "FiscalObligation_dueDate_idx" ON "FiscalObligation"("dueDate");

-- CreateIndex
CREATE INDEX "FiscalObligation_status_idx" ON "FiscalObligation"("status");

-- CreateIndex
CREATE INDEX "FiscalObligation_tenantId_dueDate_idx" ON "FiscalObligation"("tenantId", "dueDate");

-- CreateIndex
CREATE INDEX "FiscalObligation_tenantId_status_idx" ON "FiscalObligation"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");

-- CreateIndex
CREATE INDEX "InvoiceItem_productId_idx" ON "InvoiceItem"("productId");

-- CreateIndex
CREATE INDEX "Notification_tenantId_idx" ON "Notification"("tenantId");

-- CreateIndex
CREATE INDEX "Notification_tenantId_isRead_idx" ON "Notification"("tenantId", "isRead");

-- CreateIndex
CREATE INDEX "Revenue_tenantId_idx" ON "Revenue"("tenantId");

-- CreateIndex
CREATE INDEX "Revenue_year_month_idx" ON "Revenue"("year", "month");

-- CreateIndex
CREATE INDEX "SMSLog_tenantId_idx" ON "SMSLog"("tenantId");

-- CreateIndex
CREATE INDEX "Subscription_tenantId_idx" ON "Subscription"("tenantId");

-- CreateIndex
CREATE INDEX "TaxCalculation_tenantId_idx" ON "TaxCalculation"("tenantId");

-- CreateIndex
CREATE INDEX "TaxCalculation_taxType_idx" ON "TaxCalculation"("taxType");

-- CreateIndex
CREATE INDEX "TaxDeclaration_tenantId_idx" ON "TaxDeclaration"("tenantId");

-- CreateIndex
CREATE INDEX "TaxDeclaration_taxType_idx" ON "TaxDeclaration"("taxType");

-- CreateIndex
CREATE INDEX "TaxDeclaration_period_idx" ON "TaxDeclaration"("period");

-- CreateIndex
CREATE INDEX "TaxPayment_tenantId_idx" ON "TaxPayment"("tenantId");

-- CreateIndex
CREATE INDEX "TaxPayment_declarationId_idx" ON "TaxPayment"("declarationId");

-- CreateIndex
CREATE INDEX "TaxPayment_taxType_idx" ON "TaxPayment"("taxType");

-- CreateIndex
CREATE INDEX "Tenant_regime_idx" ON "Tenant"("regime");

-- AddForeignKey
ALTER TABLE "FiscalCalendarRegime" ADD CONSTRAINT "FiscalCalendarRegime_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "FiscalCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalObligation" ADD CONSTRAINT "FiscalObligation_fiscalCalendarId_fkey" FOREIGN KEY ("fiscalCalendarId") REFERENCES "FiscalCalendar"("id") ON DELETE SET NULL ON UPDATE CASCADE;
