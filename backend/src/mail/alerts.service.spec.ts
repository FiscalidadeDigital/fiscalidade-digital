import { AlertsService } from './alerts.service';

describe('AlertsService manual checks', () => {
  const prisma = {
    fiscalObligation: {
      findMany: jest.fn(),
    },
  } as any;
  const service = new AlertsService(prisma, {} as any, {} as any);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.fiscalObligation.findMany.mockResolvedValue([]);
  });

  it('limits a manual check to the authenticated tenant', async () => {
    await expect(service.runManualCheck('tenant-a')).resolves.toEqual({
      success: true,
      message: expect.any(String),
      processed: 0,
      scanned: 0,
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

    expect(prisma.fiscalObligation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-a' }),
      }),
    );
  });
});

describe('AlertsService alert metrics', () => {
  function fixture(dueInDays: number, options: { email?: string; emailEnabled?: boolean; sendError?: boolean } = {}) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueInDays);
    const fiscalAlert = {
      id: 'alert-1', notificationSent: false, emailSent: false,
      smsSent: false, whatsappSent: false,
    };
    const prisma: any = {
      fiscalObligation: { update: jest.fn().mockResolvedValue({}) },
      fiscalAlert: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(fiscalAlert),
        update: jest.fn().mockResolvedValue({}),
      },
      notification: { create: jest.fn().mockResolvedValue({ id: 'notification-1' }) },
      emailLog: { create: jest.fn().mockResolvedValue({}) },
      sMSLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const mail = { sendObligationAlert: options.sendError ? jest.fn().mockRejectedValue(new Error('provider')) : jest.fn().mockResolvedValue({ id: 'email-1' }) };
    const twilio = { sendSms: jest.fn(), sendWhatsApp: jest.fn() };
    const service = new AlertsService(prisma, mail as any, twilio as any);
    const obligation = {
      id: 'obligation-1', tenantId: 'tenant-1', title: 'IVA', period: '2026-10',
      dueDate, status: 'PENDING', alertEnabled: true,
      tenant: { name: 'Empresa', email: options.email === undefined ? 'empresa@example.invalid' : options.email, phone: null, companySettings: { emailEnabled: options.emailEnabled !== false, fiscalAlertsEnabled: true, fiscalReminderEnabled: true, smsEnabled: false, whatsappEnabled: false } },
    };
    return { service, prisma, mail, obligation };
  }

  it('counts an outside-window obligation without sending email', async () => {
    const { service, mail, obligation } = fixture(6);
    const metrics = { scanned: 1, alertsTriggered: 0, alertsCreated: 0, alertsReused: 0, notificationsCreated: 0, emailsSent: 0, emailsSkipped: 0, emailsFailed: 0, smsSent: 0, whatsappSent: 0, skipReasons: {} };
    await (service as any).processObligation(obligation, metrics);
    expect(metrics.skipReasons).toEqual({ OUTSIDE_WINDOW: 1 });
    expect(mail.sendObligationAlert).not.toHaveBeenCalled();
  });

  it.each([0, 7, 30])('sends email at the supported %s-day window', async (days) => {
    const { service, mail, obligation } = fixture(days);
    const metrics = { scanned: 1, alertsTriggered: 0, alertsCreated: 0, alertsReused: 0, notificationsCreated: 0, emailsSent: 0, emailsSkipped: 0, emailsFailed: 0, smsSent: 0, whatsappSent: 0, skipReasons: {} };
    await (service as any).processObligation(obligation, metrics);
    expect(mail.sendObligationAlert).toHaveBeenCalledTimes(1);
    expect(metrics.emailsSent).toBe(1);
  });

  it('does not duplicate an already sent alert email', async () => {
    const { service, prisma, mail, obligation } = fixture(7);
    prisma.fiscalAlert.findUnique.mockResolvedValue({ id: 'alert-1', notificationSent: true, emailSent: true, smsSent: true, whatsappSent: true });
    const metrics = { scanned: 1, alertsTriggered: 0, alertsCreated: 0, alertsReused: 0, notificationsCreated: 0, emailsSent: 0, emailsSkipped: 0, emailsFailed: 0, smsSent: 0, whatsappSent: 0, skipReasons: {} };
    await (service as any).processObligation(obligation, metrics);
    expect(mail.sendObligationAlert).not.toHaveBeenCalled();
    expect(metrics.skipReasons).toEqual({ ALREADY_SENT: 1 });
  });

  it('skips email when company email is disabled or missing', async () => {
    const disabled = fixture(7, { emailEnabled: false });
    const missing = fixture(7, { email: '' });
    const metrics = () => ({ scanned: 1, alertsTriggered: 0, alertsCreated: 0, alertsReused: 0, notificationsCreated: 0, emailsSent: 0, emailsSkipped: 0, emailsFailed: 0, smsSent: 0, whatsappSent: 0, skipReasons: {} });
    const disabledMetrics = metrics();
    const missingMetrics = metrics();
    await (disabled.service as any).processObligation(disabled.obligation, disabledMetrics);
    await (missing.service as any).processObligation(missing.obligation, missingMetrics);
    expect(disabledMetrics.skipReasons).toEqual({ EMAIL_DISABLED: 1 });
    expect(missingMetrics.skipReasons).toEqual({ MISSING_RECIPIENT: 1 });
  });

  it('records provider failure while allowing a later retry', async () => {
    const { service, mail, obligation, prisma } = fixture(7, { sendError: true });
    const metrics = { scanned: 1, alertsTriggered: 0, alertsCreated: 0, alertsReused: 0, notificationsCreated: 0, emailsSent: 0, emailsSkipped: 0, emailsFailed: 0, smsSent: 0, whatsappSent: 0, skipReasons: {} };
    await (service as any).processObligation(obligation, metrics);
    expect(mail.sendObligationAlert).toHaveBeenCalledTimes(1);
    expect(metrics.emailsFailed).toBe(1);
    expect(metrics.skipReasons).toEqual({ PROVIDER_FAILED: 1 });
    expect(prisma.fiscalAlert.update).toHaveBeenCalled();
  });

  it('processes an overdue pending obligation and leaves retry-capable email state', async () => {
    const { service, prisma, obligation } = fixture(-1, { sendError: true });
    const metrics = { scanned: 1, alertsTriggered: 0, alertsCreated: 0, alertsReused: 0, notificationsCreated: 0, emailsSent: 0, emailsSkipped: 0, emailsFailed: 0, smsSent: 0, whatsappSent: 0, skipReasons: {} };
    await (service as any).processObligation(obligation, metrics);
    expect(prisma.fiscalObligation.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'LATE' } }));
    expect(metrics.alertsTriggered).toBe(1);
    expect(metrics.emailsFailed).toBe(1);
  });
});
