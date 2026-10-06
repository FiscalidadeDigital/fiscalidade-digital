import { ServiceUnavailableException } from '@nestjs/common';

import { MailService } from './mail.service';

describe('MailService', () => {
  const originalFetch = global.fetch;
  const originalEnvironment = { ...process.env };

  beforeEach(() => {
    process.env.RESEND_API_KEY = 'test-resend-key';
    process.env.RESEND_FROM = 'Fiscalidade Digital <test@example.invalid>';
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: 'email-1' }) }) as typeof fetch;
  });

  afterEach(() => {
    process.env = { ...originalEnvironment };
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('sends verification email through Resend with HTML and text versions', async () => {
    await new MailService().sendEmailVerification('user@example.com', 'Ana', '123456');
    const request = (global.fetch as jest.Mock).mock.calls[0][1];
    const body = JSON.parse(request.body as string);
    expect(request.headers.Authorization).toBe('Bearer test-resend-key');
    expect(body.text).toContain('123456');
    expect(body.html).toContain('123456');
    expect(body.html).toContain('Fiscalidade');
  });

  it('maps provider failures to a controlled service-unavailable error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503 });
    await expect(new MailService().sendMail('user@example.com', 'Teste', 'Mensagem')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('fails safely when the provider is not configured', async () => {
    delete process.env.RESEND_API_KEY;
    await expect(new MailService().sendMail('user@example.com', 'Teste', 'Mensagem')).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
