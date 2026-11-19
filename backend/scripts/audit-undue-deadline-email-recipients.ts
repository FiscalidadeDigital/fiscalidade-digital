import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

/**
 * Read-only, approval-stage audit for the deadline-email incident.
 *
 * This script never calls an email provider and contains no Prisma mutation.
 * It refuses local databases and requires an explicitly named Neon branch. The
 * generated report is deliberately written outside this repository because it
 * contains personal data needed for a human approval of the recipient list.
 */

const prisma = new PrismaClient();
const repositoryRoot = path.resolve(__dirname, '..', '..');

type CandidateReason =
  | 'DUE_DATE_BEFORE_DECLARED_ACTIVITY'
  | 'REQUIRES_MANUAL_REVIEW_ACTIVITY_DATE_MISSING'
  | 'REQUIRES_MANUAL_REVIEW_UNDETERMINED_OBLIGATION';

type ReportRecipient = {
  tenantId: string;
  companyName: string;
  nif: string;
  currentTenantEmail: string;
  matchingActiveUsers: Array<{
    userId: string;
    name: string;
    email: string;
    role: string;
  }>;
  fiscalAlertId: string;
  alertSentAt: string;
  obligationId: string;
  obligationTitle: string;
  obligationPeriod: string | null;
  obligationDueDate: string;
  obligationStatus: string;
  declaredActivityStartedAt: string | null;
  reason: CandidateReason;
  recipientEvidence:
    | 'CURRENT_TENANT_EMAIL_MATCHES_ACTIVE_USER'
    | 'CURRENT_TENANT_EMAIL_HAS_NO_MATCHING_ACTIVE_USER';
};

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} tem de ser definido antes da auditoria.`);
  }
  return value;
}

function assertNeonReadOnlyTarget(): { branch: string; host: string } {
  const connectionString = requiredEnvironment('DATABASE_URL');
  const branch = requiredEnvironment('FISCAL_AUDIT_NEON_BRANCH');
  const host = new URL(connectionString).hostname.toLowerCase();

  if (!host.endsWith('.neon.tech')) {
    throw new Error(
      'A auditoria só pode ler uma branch Neon. A ligação local ou de produção foi recusada.',
    );
  }

  return { branch, host };
}

function reportPath(): string {
  const configuredPath = requiredEnvironment('FISCAL_BROADCAST_REPORT_PATH');
  const resolvedPath = path.resolve(configuredPath);
  const relativeToRepository = path.relative(repositoryRoot, resolvedPath);

  if (
    !path.isAbsolute(configuredPath) ||
    !relativeToRepository.startsWith('..')
  ) {
    throw new Error(
      'FISCAL_BROADCAST_REPORT_PATH tem de ser absoluto e estar fora do repositório.',
    );
  }

  return resolvedPath;
}

function isBeforeActivity(date: Date, activityStartedAt: Date): boolean {
  return date.getTime() < activityStartedAt.getTime();
}

async function main(): Promise<void> {
  if (
    process.argv.some(
      (argument) => argument === '--apply' || argument === '--send',
    )
  ) {
    throw new Error(
      'Este comando é exclusivamente de leitura; --apply e --send são recusados.',
    );
  }

  const target = assertNeonReadOnlyTarget();
  const destination = reportPath();

  const report = await prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`SET TRANSACTION READ ONLY`;

    const sentAlerts = await transaction.fiscalAlert.findMany({
      where: { emailSent: true, emailStatus: 'SENT' },
      select: {
        id: true,
        sentAt: true,
        obligation: {
          select: {
            id: true,
            title: true,
            period: true,
            dueDate: true,
            status: true,
            tenant: {
              select: {
                id: true,
                name: true,
                nif: true,
                email: true,
                activityStartedAt: true,
                users: {
                  where: { isActive: true },
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            },
          },
        },
      },
      orderBy: { sentAt: 'asc' },
    });

    const confirmed: ReportRecipient[] = [];
    const manualReview: ReportRecipient[] = [];

    for (const alert of sentAlerts) {
      const { obligation } = alert;
      const { tenant } = obligation;
      const matchingActiveUsers = tenant.users
        .filter(
          (user) =>
            user.email.trim().toLowerCase() ===
            tenant.email.trim().toLowerCase(),
        )
        .map((user) => ({
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }));
      const recipientEvidence: ReportRecipient['recipientEvidence'] =
        matchingActiveUsers.length > 0
          ? 'CURRENT_TENANT_EMAIL_MATCHES_ACTIVE_USER'
          : 'CURRENT_TENANT_EMAIL_HAS_NO_MATCHING_ACTIVE_USER';

      const base = {
        tenantId: tenant.id,
        companyName: tenant.name,
        nif: tenant.nif,
        currentTenantEmail: tenant.email,
        matchingActiveUsers,
        fiscalAlertId: alert.id,
        alertSentAt: alert.sentAt.toISOString(),
        obligationId: obligation.id,
        obligationTitle: obligation.title,
        obligationPeriod: obligation.period,
        obligationDueDate: obligation.dueDate.toISOString(),
        obligationStatus: obligation.status,
        declaredActivityStartedAt:
          tenant.activityStartedAt?.toISOString() ?? null,
        recipientEvidence,
      };

      if (
        tenant.activityStartedAt &&
        isBeforeActivity(obligation.dueDate, tenant.activityStartedAt)
      ) {
        confirmed.push({
          ...base,
          reason: 'DUE_DATE_BEFORE_DECLARED_ACTIVITY',
        });
        continue;
      }

      if (!tenant.activityStartedAt) {
        manualReview.push({
          ...base,
          reason: 'REQUIRES_MANUAL_REVIEW_ACTIVITY_DATE_MISSING',
        });
        continue;
      }

      if (
        obligation.status === 'HISTORICAL_CONFIRMATION' ||
        obligation.status === 'TO_DETERMINE'
      ) {
        manualReview.push({
          ...base,
          reason: 'REQUIRES_MANUAL_REVIEW_UNDETERMINED_OBLIGATION',
        });
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      mode: 'READ_ONLY_NEON_BRANCH_AUDIT',
      neonBranch: target.branch,
      neonHost: target.host,
      methodology: {
        sentAlertFilter: 'FiscalAlert.emailSent = true AND emailStatus = SENT',
        confirmedRule:
          'FiscalObligation.dueDate anterior a Tenant.activityStartedAt declarado.',
        caveat:
          'O registo histórico guarda o email do destinatário com máscara. O email actual do tenant é uma referência para aprovação, não prova de entrega; utilizadores só são listados quando o seu email activo coincide com o email do tenant.',
      },
      counts: {
        sentDeadlineAlertsInspected: sentAlerts.length,
        confirmedUndueEmailCandidates: confirmed.length,
        companiesWithConfirmedCandidates: new Set(
          confirmed.map((item) => item.tenantId),
        ).size,
        activeUsersMatchingConfirmedRecipientEmail: new Set(
          confirmed.flatMap((item) =>
            item.matchingActiveUsers.map((user) => user.userId),
          ),
        ).size,
        manualReviewCandidates: manualReview.length,
      },
      confirmed,
      manualReview,
    };
  });

  await writeFile(destination, `${JSON.stringify(report, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });

  console.log(
    JSON.stringify({
      mode: report.mode,
      neonBranch: report.neonBranch,
      reportPath: destination,
      counts: report.counts,
    }),
  );
}

main()
  .catch((error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : 'Falha desconhecida na auditoria.';
    console.error(
      JSON.stringify({ mode: 'READ_ONLY_NEON_BRANCH_AUDIT', error: message }),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
