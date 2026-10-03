import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AgtEinvoiceConfig } from './agt-einvoice.config';

@Injectable()
export class AgtClientService {
  async post<T>(config: AgtEinvoiceConfig, path: string, body: unknown): Promise<{ status: number; data: T }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
      const response = await fetch(`${config.baseUrl}/${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`,
          'Content-Type': 'application/json', Accept: 'application/json',
        },
        body: JSON.stringify(body), signal: controller.signal,
      });
      const text = await response.text();
      let data: T;
      try { data = text ? JSON.parse(text) as T : {} as T; }
      catch { throw new ServiceUnavailableException({ code: 'AGT_INVALID_RESPONSE', message: 'A AGT devolveu uma resposta inválida.' }); }
      if (!response.ok) throw new ServiceUnavailableException({ code: 'AGT_HTTP_ERROR', httpStatus: response.status, response: data });
      return { status: response.status, data };
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw new ServiceUnavailableException({ code: 'AGT_TIMEOUT', message: 'A comunicação com a AGT excedeu o tempo limite.' });
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException({ code: 'AGT_NETWORK_ERROR', message: 'Não foi possível comunicar com a AGT.' });
    } finally { clearTimeout(timeout); }
  }
}
