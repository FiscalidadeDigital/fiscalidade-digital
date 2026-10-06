-- Bring fresh databases to the employee/payroll schema that already exists in
-- the Prisma model and in environments previously synchronised outside Migrate.

DO $$
BEGIN
    CREATE TYPE "EmployeeStatus" AS ENUM (
        'ACTIVE',
        'INACTIVE',
        'SUSPENDED',
        'TERMINATED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "PayrollStatus" AS ENUM (
        'DRAFT',
        'CALCULATED',
        'APPROVED',
        'PAID',
        'CLOSED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Legislation"
ADD COLUMN IF NOT EXISTS "subject" TEXT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Tenant'
          AND column_name = 'employees'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Tenant'
          AND column_name = 'employeeCount'
    ) THEN
        ALTER TABLE "Tenant" RENAME COLUMN "employees" TO "employeeCount";
    ELSIF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Tenant'
          AND column_name = 'employeeCount'
    ) THEN
        ALTER TABLE "Tenant" ADD COLUMN "employeeCount" INTEGER;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Employee" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeNumber" TEXT,
    "name" TEXT NOT NULL,
    "nif" TEXT,
    "socialSecurityNumber" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "birthDate" TIMESTAMP(3),
    "hireDate" TIMESTAMP(3),
    "terminationDate" TIMESTAMP(3),
    "jobTitle" TEXT,
    "department" TEXT,
    "maritalStatus" TEXT,
    "gender" TEXT,
    "dependentCount" INTEGER NOT NULL DEFAULT 0,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmployeeDependent" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT,
    "birthDate" TIMESTAMP(3),
    "taxDependent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeDependent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmployeeSalary" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "baseSalary" DECIMAL(18,2) NOT NULL,
    "foodAllowance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "transportAllowance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "otherAllowances" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "bonuses" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "commissions" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "otherIncome" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeSalary_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Payroll" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "employeeCount" INTEGER NOT NULL DEFAULT 0,
    "grossAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "socialSecurityAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "irtAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "otherDeductionsAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payroll_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PayrollItem" (
    "id" TEXT NOT NULL,
    "payrollId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "employeeNif" TEXT,
    "socialSecurityNumber" TEXT,
    "dependentCount" INTEGER NOT NULL DEFAULT 0,
    "baseSalary" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "foodAllowance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "transportAllowance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "otherAllowances" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "bonuses" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "commissions" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "otherIncome" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "grossAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "socialSecurityBase" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "socialSecurityAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "irtTaxableAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "irtAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "otherDeductions" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Employee_tenantId_idx"
ON "Employee"("tenantId");
CREATE INDEX IF NOT EXISTS "Employee_tenantId_status_idx"
ON "Employee"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "Employee_tenantId_nif_idx"
ON "Employee"("tenantId", "nif");
CREATE INDEX IF NOT EXISTS "Employee_tenantId_socialSecurityNumber_idx"
ON "Employee"("tenantId", "socialSecurityNumber");
CREATE INDEX IF NOT EXISTS "EmployeeDependent_employeeId_idx"
ON "EmployeeDependent"("employeeId");
CREATE INDEX IF NOT EXISTS "EmployeeSalary_employeeId_idx"
ON "EmployeeSalary"("employeeId");
CREATE INDEX IF NOT EXISTS "EmployeeSalary_employeeId_active_idx"
ON "EmployeeSalary"("employeeId", "active");
CREATE INDEX IF NOT EXISTS "EmployeeSalary_effectiveFrom_idx"
ON "EmployeeSalary"("effectiveFrom");
CREATE INDEX IF NOT EXISTS "Payroll_tenantId_idx"
ON "Payroll"("tenantId");
CREATE INDEX IF NOT EXISTS "Payroll_tenantId_year_month_idx"
ON "Payroll"("tenantId", "year", "month");
CREATE INDEX IF NOT EXISTS "Payroll_status_idx"
ON "Payroll"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "Payroll_tenantId_period_key"
ON "Payroll"("tenantId", "period");
CREATE INDEX IF NOT EXISTS "PayrollItem_payrollId_idx"
ON "PayrollItem"("payrollId");
CREATE INDEX IF NOT EXISTS "PayrollItem_employeeId_idx"
ON "PayrollItem"("employeeId");
CREATE UNIQUE INDEX IF NOT EXISTS "PayrollItem_payrollId_employeeId_key"
ON "PayrollItem"("payrollId", "employeeId");
CREATE INDEX IF NOT EXISTS "Legislation_subject_idx"
ON "Legislation"("subject");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Employee_tenantId_fkey'
    ) THEN
        ALTER TABLE "Employee"
        ADD CONSTRAINT "Employee_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'EmployeeDependent_employeeId_fkey'
    ) THEN
        ALTER TABLE "EmployeeDependent"
        ADD CONSTRAINT "EmployeeDependent_employeeId_fkey"
        FOREIGN KEY ("employeeId") REFERENCES "Employee"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'EmployeeSalary_employeeId_fkey'
    ) THEN
        ALTER TABLE "EmployeeSalary"
        ADD CONSTRAINT "EmployeeSalary_employeeId_fkey"
        FOREIGN KEY ("employeeId") REFERENCES "Employee"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Payroll_tenantId_fkey'
    ) THEN
        ALTER TABLE "Payroll"
        ADD CONSTRAINT "Payroll_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'PayrollItem_employeeId_fkey'
    ) THEN
        ALTER TABLE "PayrollItem"
        ADD CONSTRAINT "PayrollItem_employeeId_fkey"
        FOREIGN KEY ("employeeId") REFERENCES "Employee"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'PayrollItem_payrollId_fkey'
    ) THEN
        ALTER TABLE "PayrollItem"
        ADD CONSTRAINT "PayrollItem_payrollId_fkey"
        FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
