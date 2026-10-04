-- Calendar-derived FiscalObligation idempotency is enforced by this PostgreSQL
-- partial unique index. Prisma cannot represent a partial @@unique constraint.
-- Historical obligations without both fiscalCalendarId and period are intentionally
-- outside this constraint and are not modified by this migration.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "FiscalObligation"
    WHERE "fiscalCalendarId" IS NOT NULL
      AND "period" IS NOT NULL
    GROUP BY "tenantId", "fiscalCalendarId", "period"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot create FiscalObligation calendar idempotency index: duplicate calendar-derived obligations exist';
  END IF;
END
$$;

CREATE UNIQUE INDEX "FiscalObligation_tenant_calendar_period_unique"
ON "FiscalObligation" ("tenantId", "fiscalCalendarId", "period")
WHERE "fiscalCalendarId" IS NOT NULL
  AND "period" IS NOT NULL;
