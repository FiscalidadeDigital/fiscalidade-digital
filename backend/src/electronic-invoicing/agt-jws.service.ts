import { BadRequestException, Injectable } from '@nestjs/common';
import { createPrivateKey, createSign, KeyObject } from 'node:crypto';

const base64url = (value: Buffer | string) => Buffer.from(value).toString('base64url');

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(',')}}`;
}

@Injectable()
export class AgtJwsService {
  private key(pem: string): KeyObject {
    try {
      const key = createPrivateKey(pem);
      const bits = key.asymmetricKeyDetails?.modulusLength ?? 0;
      if (key.asymmetricKeyType !== 'rsa' || bits < 2048) throw new Error('RSA >= 2048 required');
      return key;
    } catch {
      throw new BadRequestException({ code: 'AGT_SIGNATURE_KEY_INVALID', message: 'A chave AGT deve ser RSA válida com pelo menos 2048 bits.' });
    }
  }

  sign(payload: Record<string, unknown>, pem: string): string {
    const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const body = base64url(canonicalJson(payload));
    const input = `${header}.${body}`;
    const signer = createSign('RSA-SHA256');
    signer.update(input, 'utf8');
    signer.end();
    return `${input}.${signer.sign(this.key(pem)).toString('base64url')}`;
  }
}
