-- Exceptional operational deadlines are additive. The legal/calendar date
-- remains in FiscalCalendar.dueDate and historical obligations are untouched.
CREATE TABLE "FiscalDeadlineOverride" (
  "id" TEXT NOT NULL,
  "fiscalCalendarId" TEXT NOT NULL,
  "originalDueDate" TIMESTAMP(3) NOT NULL,
  "operationalDueDate" TIMESTAMP(3) NOT NULL,
  "reason" TEXT NOT NULL,
  "officialReference" TEXT,
  "sourceUrl" TEXT,
  "publishedAt" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FiscalDeadlineOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FiscalDeadlineOverride_fiscalCalendarId_key" ON "FiscalDeadlineOverride"("fiscalCalendarId");
CREATE INDEX "FiscalDeadlineOverride_operationalDueDate_idx" ON "FiscalDeadlineOverride"("operationalDueDate");
CREATE INDEX "FiscalDeadlineOverride_active_idx" ON "FiscalDeadlineOverride"("active");

ALTER TABLE "FiscalDeadlineOverride"
  ADD CONSTRAINT "FiscalDeadlineOverride_fiscalCalendarId_fkey"
  FOREIGN KEY ("fiscalCalendarId") REFERENCES "FiscalCalendar"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AGT comunicado de 17-04-2026. Insert only when the official 2026 Model 7
-- calendar row is already present; this leaves other years, regimes and dates
-- untouched.
INSERT INTO "FiscalDeadlineOverride" (
  "id",
  "fiscalCalendarId",
  "originalDueDate",
  "operationalDueDate",
  "reason",
  "officialReference",
  "sourceUrl",
  "publishedAt",
  "active",
  "updatedAt"
)
SELECT
  'fiscal-deadline-override-iva-general-2026-04',
  "id",
  "dueDate",
  TIMESTAMP '2026-04-30 23:59:59',
  'Fortes chuvas - extensao excepcional comunicada pela AGT.',
  'Comunicado AGT de 17-04-2026: extensao de 15-04-2026 para 30-04-2026.',
  'https://portaldocontribuinte.minfin.gov.ao/noticia?id=985577',
  TIMESTAMP '2026-04-17 00:00:00',
  true,
  CURRENT_TIMESTAMP
FROM "FiscalCalendar"
WHERE "referenceYear" = 2026
  AND "taxType" = 'IVA'
  AND "dueDate" = TIMESTAMP '2026-04-15 23:59:59'
  AND "title" LIKE '%Modelo 7%'
ON CONFLICT ("fiscalCalendarId") DO NOTHING;
