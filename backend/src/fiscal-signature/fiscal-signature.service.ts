import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createPrivateKey, createPublicKey, createSign, createVerify } from 'node:crypto';

import {
  FiscalSignatureConfiguration,
  FiscalSignaturePayload,
  FiscalSignatureProvider,
  FiscalSignatureResult,
} from './fiscal-signature.types';

const OFFICIAL_HASH_LENGTH = 172;

const angolaParts = (value: Date) => Object.fromEntries(
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Luanda', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(value).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
);

export const formatSaftDate = (value: Date) => {
  const part = angolaParts(value);
  return `${part.year}-${part.month}-${part.day}`;
};

export const formatSaftDateTime = (value: Date) => {
  const part = angolaParts(value);
  return `${part.year}-${part.month}-${part.day}T${part.hour}:${part.minute}:${part.second}`;
};

export function buildFiscalSignatureCanonicalText(payload: FiscalSignaturePayload): string {
  return [
    formatSaftDate(payload.invoiceDate),
    formatSaftDateTime(payload.systemEntryDate),
    payload.invoiceNo,
    payload.grossTotal,
    payload.previousHash ?? '',
  ].join(';');
}

@Injectable()
export class FiscalSignatureService implements FiscalSignatureProvider {
  configuration(): FiscalSignatureConfiguration {
    const key = this.privateKey();
    const version = this.keyVersion();
    if (!key || version === null) {
      return {
        configured: false,
        blocker: {
          code: 'FISCAL_SIGNATURE_NOT_CONFIGURED',
          message: 'Configure FISCAL_SIGNATURE_PRIVATE_KEY e FISCAL_SIGNATURE_KEY_VERSION no backend.',
        },
      };
    }
    return { configured: true };
  }

  sign(payload: FiscalSignaturePayload): FiscalSignatureResult {
    const privateKey = this.privateKey();
    const keyVersion = this.keyVersion();
    if (!privateKey || keyVersion === null) {
      throw new ServiceUnavailableException(this.configuration().blocker);
    }

    const keyObject = createPrivateKey(privateKey);
    if (keyObject.asymmetricKeyType !== 'rsa' || keyObject.asymmetricKeyDetails?.modulusLength !== 1024) {
      throw new ServiceUnavailableException({
        code: 'FISCAL_SIGNATURE_INVALID_KEY',
        message: 'A chave fiscal deve ser RSA PEM de 1024 bits conforme o Decreto Executivo n.º 74/19.',
      });
    }

    const canonicalText = buildFiscalSignatureCanonicalText(payload);
    const signer = createSign('RSA-SHA1');
    signer.update(canonicalText, 'utf8');
    signer.end();
    const hash = signer.sign({ key: keyObject, padding: 1 }).toString('base64');
    if (hash.length !== OFFICIAL_HASH_LENGTH || /[\r\n]/.test(hash)) {
      throw new ServiceUnavailableException({
        code: 'FISCAL_SIGNATURE_INVALID_OUTPUT',
        message: 'A assinatura fiscal não tem o formato Base64 esperado.',
      });
    }
    return {
      hash,
      hashControl: String(keyVersion),
      keyVersion,
      canonicalText,
    };
  }

  verify(payload: FiscalSignaturePayload, hash: string, publicKey: string): boolean {
    const verifier = createVerify('RSA-SHA1');
    verifier.update(buildFiscalSignatureCanonicalText(payload), 'utf8');
    verifier.end();
    return verifier.verify(createPublicKey(publicKey), Buffer.from(hash, 'base64'));
  }

  private privateKey(): string | null {
    const value = process.env.FISCAL_SIGNATURE_PRIVATE_KEY?.trim();
    return value ? value.replace(/\\n/g, '\n') : null;
  }

  private keyVersion(): number | null {
    const raw = process.env.FISCAL_SIGNATURE_KEY_VERSION?.trim();
    const value = raw ? Number(raw) : NaN;
    return Number.isInteger(value) && value > 0 ? value : null;
  }
}
