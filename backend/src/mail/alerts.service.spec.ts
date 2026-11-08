import { AlertsService } from './alerts.service';

describe('AlertsService manual checks', () => {
  const prisma = {
    fiscalObligation: {
      findMany: jest.fn(),
    },
  } as any;
  const service = new AlertsService(prisma, {} as any, {} as any, undefined, {
    filterEligible: jest.fn().mockResolvedValue([]),
  } as any);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.fiscalObligation.findMany.mockResolvedValue([]);
  });

  it('limits a manual check to the authenticated tenant', async () => {
    await expect(service.runManualCheck('tenant-a')).resolves.toEqual({
      success: true,
      message: expect.any(String),
      processed: 0,
      companiesEligible: 0,
      companiesEvaluated: 1,
      scanned: 0,
      alertsTriggered: 0,
      alertsCreated: 0,
      alertsReused: 0,
      notificationsCreated: 0,
      emailsSent: 0,
      emailsSkipped: 0,
      emailsFailed: 0,
      emailAttempts: 0,
      eligibilityErrors: 0,
      eligibilitySkipped: 0,
      reminderLimitReached: false,
      smsSent: 0,
      whatsappSent: 0,
      skipReasons: {},
    });

    expect(prisma.fiscalObligation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-a' }),
      }),
    );
  });

  it('skips a tenant whose eligibility evaluation fails and continues with the next one', async () => {
    const eligible = {
      id: 'obligation-b',
      tenantId: 'tenant-b',
      type: 'IVA',
      dueDate: new Date(),
      tenant: { companySettings: {} },
    };
    prisma.fiscalObligation.findMany.mockResolvedValue([
      { ...eligible, id: 'obligation-a', tenantId: 'tenant-a' },
      eligible,
    ]);
    const eligibility = {
      filterEligible: jest.fn(async (tenantId: string, obligations: unknown[]) => {
        if (tenantId === 'tenant-a') throw new Error('read failed');
        return obligations;
      }),
    };
    const isolatedService = new AlertsService(
      prisma as never,
      {} as never,
      {} as never,
      undefined,
      eligibility as never,
    );
    const metrics = {
      companiesEligible: 0,
      companiesEvaluated: 0,
      eligibilityErrors: 0,
      scanned: 0,
      alertsTriggered: 0,
      alertsCreated: 0,
      alertsReused: 0,
      notificationsCreated: 0,
      emailsSent: 0,
      emailsSkipped: 0,
      emailsFailed: 0,
      emailAttempts: 0,
      eligibilitySkipped: 0,
      reminderLimitReached: false,
      smsSent: 0,
      whatsappSent: 0,
      skipReasons: {},
    };

    await expect(
      (isolatedService as any).findEligibleObligations(metrics),
    ).resolves.toEqual([eligible]);
    expect(metrics).toMatchObject({
      companiesEvaluated: 2,
      companiesEligible: 1,
      eligibilityErrors: 1,
      eligibilitySkipped: 1,
    });
  });
});

describe('AlertsService alert metrics', () => {
  const originalReminderEmailsEnabled = process.env.REMINDER_EMAILS_ENABLED;
  const originalReminderMaxPerRun = process.env.REMINDER_MAX_PER_RUN;

  beforeEach(() => {
    process.env.REMINDER_EMAILS_ENABLED = 'true';
  });

  afterAll(() => {
    if (originalReminderEmailsEnabled === undefined) {
      delete process.env.REMINDER_EMAILS_ENABLED;
    } else {
      process.env.REMINDER_EMAILS_ENABLED = originalReminderEmailsEnabled;
    }
    if (originalReminderMaxPerRun === undefined) {
      delete process.env.REMINDER_MAX_PER_RUN;
    } else {
      process.env.REMINDER_MAX_PER_RUN = originalReminderMaxPerRun;
    }
  });

  function fixture(
    dueInDays: number,
    options: {
      email?: string;
      emailEnabled?: boolean;
      sendError?: boolean;
    } = {},
  ) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueInDays);
    const fiscalAlert = {
      id: 'alert-1',
      notificationSent: false,
      emailSent: false,
      smsSent: false,
      whatsappSent: false,
    };
    const prisma: any = {
      fiscalObligation: { update: jest.fn().mockResolvedValue({}) },
      fiscalAlert: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(fiscalAlert),
        update: jest.fn().mockResolvedValue({}),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notification-1' }),
      },
      emailLog: { create: jest.fn().mockResolvedValue({}) },
      sMSLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const mail = {
      sendObligationAlert: options.sendError
        ? jest.fn().mockRejectedValue(new Error('provider'))
        : jest.fn().mockResolvedValue({ id: 'email-1' }),
    };
    const twilio = { sendSms: jest.fn(), sendWhatsApp: jest.fn() };
    const service = new AlertsService(prisma, mail as any, twilio as any);
    const obligation = {
      id: 'obligation-1',
      tenantId: 'tenant-1',
      title: 'IVA',
      period: '2026-10',
      dueDate,
      status: 'PENDING',
      alertEnabled: true,
      tenant: {
        name: 'Empresa',
        email:
          options.email === undefined
            ? 'empresa@example.invalid'
            : options.email,
        phone: null,
        companySettings: {
          emailEnabled: options.emailEnabled !== false,
          fiscalAlertsEnabled: true,
          fiscalReminderEnabled: true,
          smsEnabled: false,
          whatsappEnabled: false,
        },
      },
    };
    return { service, prisma, mail, obligation };
  }

  it('counts an outside-window obligation without sending email', async () => {
    const { service, mail, obligation } = fixture(6);
    const metrics = {
      scanned: 1,
      alertsTriggered: 0,
      alertsCreated: 0,
      alertsReused: 0,
      notificationsCreated: 0,
      emailsSent: 0,
      emailsSkipped: 0,
      emailsFailed: 0,
      emailAttempts: 0,
      eligibilityErrors: 0,
      smsSent: 0,
      whatsappSent: 0,
      reminderLimitReached: false,
      skipReasons: {},
    };
    await (service as any).processObligation(obligation, metrics);
    expect(metrics.skipReasons).toEqual({ OUTSIDE_WINDOW: 1 });
    expect(mail.sendObligationAlert).not.toHaveBeenCalled();
  });

  it('sends reminder emails by default and stops only when explicitly disabled', async () => {
    const { service, mail, obligation } = fixture(7);
    const metrics = {
      scanned: 1,
      alertsTriggered: 0,
      alertsCreated: 0,
      alertsReused: 0,
      notificationsCreated: 0,
      emailsSent: 0,
      emailsSkipped: 0,
      emailsFailed: 0,
      smsSent: 0,
      whatsappSent: 0,
      skipReasons: {},
    };

    delete process.env.REMINDER_EMAILS_ENABLED;
    await (service as any).processObligation(obligation, metrics);

    expect(mail.sendObligationAlert).toHaveBeenCalledTimes(1);
    expect(metrics.emailsSent).toBe(1);

    process.env.REMINDER_EMAILS_ENABLED = 'false';
    const disabled = fixture(7);
    const disabledMetrics = { ...metrics, emailsSent: 0, emailsSkipped: 0, skipReasons: {} };
    await (disabled.service as any).processObligation(
      disabled.obligation,
      disabledMetrics,
    );

    expect(disabled.mail.sendObligationAlert).not.toHaveBeenCalled();
    expect(disabledMetrics.emailsSent).toBe(0);
    expect(disabledMetrics.skipReasons).toEqual({ REMINDER_EMAILS_DISABLED: 1 });
  });

  it.each([0, 7, 30])(
    'sends email at the supported %s-day window',
    async (days) => {
      const { service, mail, obligation } = fixture(days);
      const metrics = {
        scanned: 1,
        alertsTriggered: 0,
        alertsCreated: 0,
        alertsReused: 0,
        notificationsCreated: 0,
        emailsSent: 0,
        emailsSkipped: 0,
        emailsFailed: 0,
        smsSent: 0,
        whatsappSent: 0,
        skipReasons: {},
      };
      await (service as any).processObligation(obligation, metrics);
      expect(mail.sendObligationAlert).toHaveBeenCalledTimes(1);
      expect(metrics.emailsSent).toBe(1);
    },
  );

  it('does not duplicate an already sent alert email', async () => {
    const { service, prisma, mail, obligation } = fixture(7);
    prisma.fiscalAlert.findUnique.mockResolvedValue({
      id: 'alert-1',
      notificationSent: true,
      emailSent: true,
      smsSent: true,
      whatsappSent: true,
    });
    const metrics = {
      scanned: 1,
      alertsTriggered: 0,
      alertsCreated: 0,
      alertsReused: 0,
      notificationsCreated: 0,
      emailsSent: 0,
      emailsSkipped: 0,
      emailsFailed: 0,
      smsSent: 0,
      whatsappSent: 0,
      skipReasons: {},
    };
    await (service as any).processObligation(obligation, metrics);
    expect(mail.sendObligationAlert).not.toHaveBeenCalled();
    expect(metrics.skipReasons).toEqual({ ALREADY_SENT: 1 });
  });

  it('stops reminder delivery after the configured run limit', async () => {
    process.env.REMINDER_MAX_PER_RUN = '1';
    const first = fixture(7);
    const second = fixture(7);
    const metrics = {
      scanned: 2,
      alertsTriggered: 0,
      alertsCreated: 0,
      alertsReused: 0,
      notificationsCreated: 0,
      emailsSent: 0,
      emailsSkipped: 0,
      emailsFailed: 0,
      emailAttempts: 0,
      eligibilitySkipped: 0,
      eligibilityErrors: 0,
      companiesEvaluated: 0,
      companiesEligible: 0,
      reminderLimitReached: false,
      smsSent: 0,
      whatsappSent: 0,
      skipReasons: {},
    };

    await (first.service as any).processObligation(first.obligation, metrics);
    await (second.service as any).processObligation(second.obligation, metrics);

    expect(first.mail.sendObligationAlert).toHaveBeenCalledTimes(1);
    expect(second.mail.sendObligationAlert).not.toHaveBeenCalled();
    expect(metrics.reminderLimitReached).toBe(true);
    expect(metrics.skipReasons).toEqual({ REMINDER_MAX_PER_RUN_REACHED: 1 });
  });

  it('skips email when company email is disabled or missing', async () => {
    const disabled = fixture(7, { emailEnabled: false });
    const missing = fixture(7, { email: '' });
    const metrics = () => ({
      scanned: 1,
      alertsTriggered: 0,
      alertsCreated: 0,
      alertsReused: 0,
      notificationsCreated: 0,
      emailsSent: 0,
      emailsSkipped: 0,
      emailsFailed: 0,
      smsSent: 0,
      whatsappSent: 0,
      skipReasons: {},
    });
    const disabledMetrics = metrics();
    const missingMetrics = metrics();
    await (disabled.service as any).processObligation(
      disabled.obligation,
      disabledMetrics,
    );
    await (missing.service as any).processObligation(
      missing.obligation,
      missingMetrics,
    );
    expect(disabledMetrics.skipReasons).toEqual({ EMAIL_DISABLED: 1 });
    expect(missingMetrics.skipReasons).toEqual({ MISSING_RECIPIENT: 1 });
  });

  it('records provider failure while allowing a later retry', async () => {
    const { service, mail, obligation, prisma } = fixture(7, {
      sendError: true,
    });
    const metrics = {
      scanned: 1,
      alertsTriggered: 0,
      alertsCreated: 0,
      alertsReused: 0,
      notificationsCreated: 0,
      emailsSent: 0,
      emailsSkipped: 0,
      emailsFailed: 0,
      smsSent: 0,
      whatsappSent: 0,
      skipReasons: {},
    };
    await (service as any).processObligation(obligation, metrics);
    expect(mail.sendObligationAlert).toHaveBeenCalledTimes(1);
    expect(metrics.emailsFailed).toBe(1);
    expect(metrics.skipReasons).toEqual({ PROVIDER_FAILED: 1 });
    expect(prisma.fiscalAlert.update).toHaveBeenCalled();
  });

  it('processes an overdue pending obligation and leaves retry-capable email state', async () => {
    const { service, prisma, obligation } = fixture(-1, { sendError: true });
    const metrics = {
      scanned: 1,
      alertsTriggered: 0,
      alertsCreated: 0,
      alertsReused: 0,
      notificationsCreated: 0,
      emailsSent: 0,
      emailsSkipped: 0,
      emailsFailed: 0,
      smsSent: 0,
      whatsappSent: 0,
      skipReasons: {},
    };
    await (service as any).processObligation(obligation, metrics);
    expect(prisma.fiscalObligation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'LATE' } }),
    );
    expect(metrics.alertsTriggered).toBe(1);
    expect(metrics.emailsFailed).toBe(1);
  });
});
