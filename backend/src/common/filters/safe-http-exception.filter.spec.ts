import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { SafeHttpExceptionFilter } from './safe-http-exception.filter';

type PublicErrorBody = {
  statusCode: number;
  message: string;
  referenceCode: string;
  nextStep?: 'CONFIRM_IVA' | 'COMPLETE_INVOICE_CLASSIFICATION';
};

type MockResponse = {
  headersSent: boolean;
  status: jest.Mock<MockResponse, [number]>;
  json: jest.Mock<MockResponse, [PublicErrorBody]>;
};

describe('SafeHttpExceptionFilter', () => {
  function responseFor(): {
    response: MockResponse;
    capturedBody: () => PublicErrorBody | undefined;
  } {
    let body: PublicErrorBody | undefined;
    const response: MockResponse = {} as MockResponse;
    response.headersSent = false;
    response.status = jest.fn<MockResponse, [number]>(() => response);
    response.json = jest.fn<MockResponse, [PublicErrorBody]>((payload) => {
      body = payload;
      return response;
    });

    return { response, capturedBody: () => body };
  }

  function hostFor(response: MockResponse) {
    return {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({
          method: 'POST',
          originalUrl: '/private?token=hidden',
        }),
      }),
    } as unknown as ArgumentsHost;
  }

  it('does not disclose a thrown validation message or structured payload', () => {
    const { response, capturedBody } = responseFor();
    const filter = new SafeHttpExceptionFilter();

    filter.catch(
      new BadRequestException({
        message: 'SQL table fiscal_obligation is unavailable',
        privateKey: 'must-not-leak',
      }),
      hostFor(response),
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const body = capturedBody();
    expect(body).toBeDefined();
    if (!body) {
      throw new Error('Expected a public error response body.');
    }
    expect(body.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(body.message).toMatch(/validar os dados/i);
    expect(body.referenceCode).toMatch(/^FD-[A-Z0-9]{8}$/);
    expect(JSON.stringify(body)).not.toContain('fiscal_obligation');
    expect(JSON.stringify(body)).not.toContain('must-not-leak');
  });

  it('uses a generic server-error message for unknown failures', () => {
    const { response, capturedBody } = responseFor();
    const filter = new SafeHttpExceptionFilter();

    filter.catch(
      new Error('postgres://user:password@host/db'),
      hostFor(response),
    );

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    const body = capturedBody();
    expect(body).toBeDefined();
    if (!body) {
      throw new Error('Expected a public error response body.');
    }
    expect(body.message).toMatch(/Não foi possível concluir/i);
  });
  it('publishes only a safe next step for known fiscal validation states', () => {
    const { response, capturedBody } = responseFor();
    const filter = new SafeHttpExceptionFilter();

    filter.catch(
      new BadRequestException({
        code: 'IVA_ENROLLMENT_REQUIRED',
        message: 'Internal fiscal rule detail must remain private.',
      }),
      hostFor(response),
    );

    const body = capturedBody();
    expect(body).toEqual(expect.objectContaining({ nextStep: 'CONFIRM_IVA' }));
    expect(JSON.stringify(body)).not.toContain('IVA_ENROLLMENT_REQUIRED');
    expect(JSON.stringify(body)).not.toContain('Internal fiscal rule detail');
  });
});
