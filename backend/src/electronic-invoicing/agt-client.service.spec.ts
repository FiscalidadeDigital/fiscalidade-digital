import { ServiceUnavailableException } from '@nestjs/common';
import { AgtClientService } from './agt-client.service';
import type { AgtEinvoiceConfig } from './agt-einvoice.config';

const config: AgtEinvoiceConfig = {
  environment: 'homologation', baseUrl: 'https://sifphml.minfin.gov.ao/sigt/fe/v1',
  username: 'test-user', password: 'test-password', privateKey: 'unused', timeoutMs: 100,
  software: { productId: 'test', productVersion: '1', softwareValidationNumber: 'test', signatureVersion: 1 },
};

describe('AgtClientService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('uses Basic Auth server-side and parses JSON', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{"requestID":"REQ1"}', { status: 200 }));
    await expect(new AgtClientService().post(config, 'registarFactura', { safe: true })).resolves.toEqual({ status: 200, data: { requestID: 'REQ1' } });
    expect(fetchMock).toHaveBeenCalledWith(`${config.baseUrl}/registarFactura`, expect.objectContaining({
      headers: expect.objectContaining({ Authorization: `Basic ${Buffer.from('test-user:test-password').toString('base64')}` }),
    }));
  });

  it('rejects invalid JSON without exposing credentials', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('not-json', { status: 200 }));
    await expect(new AgtClientService().post(config, 'obterEstado', {})).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('surfaces non-success HTTP status', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{"errorList":[]}', { status: 429 }));
    await expect(new AgtClientService().post(config, 'obterEstado', {})).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it.each([400, 401, 500])('handles HTTP %s as an AGT error', async (status) => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{"errorList":[]}', { status }));
    await expect(new AgtClientService().post(config, 'registarFactura', {})).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'AGT_HTTP_ERROR', httpStatus: status }),
    });
  });

  it('propagates a network failure without retrying', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockRejectedValue(new TypeError('network unavailable'));
    await expect(new AgtClientService().post(config, 'registarFactura', {})).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'AGT_NETWORK_ERROR' }),
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('aborts after the configured timeout', async () => {
    jest.spyOn(global, 'fetch').mockImplementation((_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    }));
    await expect(new AgtClientService().post({ ...config, timeoutMs: 5 }, 'obterEstado', {})).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'AGT_TIMEOUT' }),
    });
  });
});
