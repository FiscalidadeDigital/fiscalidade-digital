import { PrismaClient } from '@prisma/client';

import { AlertsService } from '../src/mail/alerts.service';

const databaseUrl = process.env.NEON_BRANCH_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'Defina NEON_BRANCH_DATABASE_URL para o branch Neon de leitura.',
  );
}

const host = new URL(databaseUrl).hostname.toLowerCase();
if (!host.endsWith('.neon.tech')) {
  throw new Error(
    'A simulação aceita apenas uma ligação Neon; a produção não é permitida.',
  );
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});

async function main() {
  const alerts = new AlertsService(prisma as never, {} as never, {} as never);
  const result = await alerts.simulateScheduledCheck();

  // Deliberately reports only aggregates; this command has no delivery path.
  console.log(
    JSON.stringify({
      companiesEvaluated: result.companiesEvaluated,
      companiesEligible: result.companiesEligible,
      emailsWouldSend: result.emailsWouldSend,
      emailsSkipped: result.emailsSkipped,
      eligibilitySkipped: result.eligibilitySkipped,
      zeroSendsForIneligibleCompanies: true,
    }),
  );
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : 'Falha na simulação.',
    );
    process.exitCode = 1;
  });
