-- AlterTable
ALTER TABLE "Tenant"
ADD COLUMN "storageBaseQuotaBytes" BIGINT,
ADD COLUMN "storageAdditionalBytes" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN "storageUsedBytes" BIGINT NOT NULL DEFAULT 0;

-- Backfill the authoritative counter from existing document metadata.
UPDATE "Tenant" AS tenant
SET "storageUsedBytes" = COALESCE((
    SELECT SUM(document."size")::BIGINT
    FROM "Document" AS document
    WHERE document."tenantId" = tenant."id"
), 0);

-- Quotas and counters cannot be negative. A null base quota remains the
-- explicit state for tenants whose commercial capacity is not configured.
ALTER TABLE "Tenant"
ADD CONSTRAINT "Tenant_storageBaseQuotaBytes_nonnegative"
CHECK ("storageBaseQuotaBytes" IS NULL OR "storageBaseQuotaBytes" >= 0),
ADD CONSTRAINT "Tenant_storageAdditionalBytes_nonnegative"
CHECK ("storageAdditionalBytes" >= 0),
ADD CONSTRAINT "Tenant_storageUsedBytes_nonnegative"
CHECK ("storageUsedBytes" >= 0);
