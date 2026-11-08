import 'dotenv/config';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

/**
 * Read-only report for planning the fiscal-lifecycle rollout.  It never
 * writes, even when pointed at a database, and it refuses a remote database
 * unless the operator explicitly allows a read-only simulation.
 */
const prisma = new PrismaClient();

const localDatabaseHosts = new Set(['localhost', '127.0.0.1', '::1']);

function anonymous(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 10);
}

function dateFromPeriod(value: string | null, dueDate: Date) {
  const match = value?.match(/^(\d{4})-(\d{2})/);
  if (match) {
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  }
  return new Date(Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), 1));
}

function assertSimulationOnly() {
  if (process.argv.includes('--apply')) {
    throw new Error(
      'Este script só tem modo de simulação e não aceita --apply.',
    );
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL é necessária para executar a simulação.');
  }

  const host = new URL(databaseUrl).hostname.toLowerCase();
  if (
    !localDatabaseHosts.has(host) &&
    process.env.FISCAL_SIMULATION_ALLOW_REMOTE_READ !== 'true'
  ) {
    throw new Error(
      'Leitura remota recusada. Defina FISCAL_SIMULATION_ALLOW_REMOTE_READ=true apenas depois de confirmar que a conta de base de dados é só de leitura.',
    );
  }
}

async function simulate() {
  assertSimulationOnly();

  const [tenants, obligations] = await Promise.all([
    prisma.tenant.findMany({
      select: {
        id: true,
        regime: true,
        activityStartedAt: true,
        hasPriorUnregularizedObligations: true,
        taxRegimeAssignments: {
          select: { id: true },
          take: 1,
        },
      },
    }),
    prisma.fiscalObligation.findMany({
      select: {
        id: true,
        tenantId: true,
        amount: true,
        amountValue: true,
        status: true,
        dueDate: true,
        period: true,
        referenceYear: true,
        fiscalCalendarId: true,
      },
    }),
  ]);

  const profileByTenant = new Map(tenants.map((tenant) => [tenant.id, tenant]));
  const legacyOnly = tenants.filter(
    (tenant) => tenant.regime && tenant.taxRegimeAssignments.length === 0,
  );
  const olderThanActivity = obligations.filter((obligation) => {
    const profile = profileByTenant.get(obligation.tenantId);
    if (!profile?.activityStartedAt) return false;
    return (
      dateFromPeriod(obligation.period, obligation.dueDate) <
      profile.activityStartedAt
    );
  });
  const undetermined = obligations.filter(
    (obligation) =>
      obligation.amount === null && obligation.amountValue === null,
  );
  const missingReferenceYear = obligations.filter(
    (obligation) => obligation.referenceYear === null,
  );

  const report = {
    mode: 'simulation-only',
    generatedAt: new Date().toISOString(),
    writesPerformed: 0,
    summary: {
      tenants: tenants.length,
      tenantsWithoutActivityStart: tenants.filter(
        (tenant) => !tenant.activityStartedAt,
      ).length,
      tenantsWithLegacyRegimeOnly: legacyOnly.length,
      tenantsDeclaringPriorUnregularizedObligations: tenants.filter(
        (tenant) => tenant.hasPriorUnregularizedObligations,
      ).length,
      obligations: obligations.length,
      obligationsBeforeDeclaredActivity: olderThanActivity.length,
      obligationsWithAmountToDetermine: undetermined.length,
      obligationsWithoutReferenceYear: missingReferenceYear.length,
    },
    examples: {
      legacyRegimeOnlyTenants: legacyOnly.slice(0, 5).map((tenant) => ({
        tenant: `tenant-${anonymous(tenant.id)}`,
      })),
      obligationsBeforeDeclaredActivity: olderThanActivity
        .slice(0, 5)
        .map((obligation) => ({
          obligation: `obligation-${anonymous(obligation.id)}`,
          tenant: `tenant-${anonymous(obligation.tenantId)}`,
          period: obligation.period ?? 'não indicado',
        })),
      obligationsWithoutReferenceYear: missingReferenceYear
        .slice(0, 5)
        .map((obligation) => ({
          obligation: `obligation-${anonymous(obligation.id)}`,
          tenant: `tenant-${anonymous(obligation.tenantId)}`,
          period: obligation.period ?? 'não indicado',
        })),
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

if (process.argv.includes('--help')) {
  console.log(
    'Uso: npm run fiscal:simulate\n\nExecuta somente leituras e apresenta contagens anonimizadas. Para uma base remota, exige FISCAL_SIMULATION_ALLOW_REMOTE_READ=true e uma credencial só de leitura.',
  );
  void prisma.$disconnect();
} else {
  simulate()
    .catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Falha desconhecida.';
      console.error(`Simulação fiscal não executada: ${message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
