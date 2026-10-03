import { generateKeyPairSync } from 'node:crypto';

import { buildFiscalSignatureCanonicalText, FiscalSignatureService } from './fiscal-signature.service';

describe('FiscalSignatureService', () => {
  const original = { ...process.env };
  const pair = generateKeyPairSync('rsa', {
    modulusLength: 1024,
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });

  beforeEach(() => {
    process.env.FISCAL_SIGNATURE_PRIVATE_KEY = pair.privateKey;
    process.env.FISCAL_SIGNATURE_KEY_VERSION = '3';
  });
  afterAll(() => { process.env = original; });

  const first = {
    invoiceDate: new Date('2018-05-18T00:00:00.000Z'),
    systemEntryDate: new Date('2018-05-18T10:22:19.000Z'),
    invoiceNo: 'FAC 001/18',
    grossTotal: '53.00',
    previousHash: null,
  };

  it('assina o primeiro documento com o payload oficial e Base64 de 172 caracteres', () => {
    const service = new FiscalSignatureService();
    expect(buildFiscalSignatureCanonicalText(first)).toBe('2018-05-18;2018-05-18T11:22:19;FAC 001/18;53.00;');
    const signed = service.sign(first);
    expect(service.sign(first).hash).toBe(signed.hash);
    expect(signed.hash).toHaveLength(172);
    expect(signed.hashControl).toBe('3');
    expect(service.verify(first, signed.hash, pair.publicKey)).toBe(true);
  });

  it('encadeia o segundo documento e detecta qualquer alteração', () => {
    const service = new FiscalSignatureService();
    const firstHash = service.sign(first).hash;
    const second = { ...first, invoiceNo: 'FAC 001/19', grossTotal: '75.00', previousHash: firstHash };
    const signed = service.sign(second);
    expect(service.verify(second, signed.hash, pair.publicKey)).toBe(true);
    for (const changed of [
      { ...second, invoiceDate: new Date('2018-05-19T00:00:00Z') },
      { ...second, systemEntryDate: new Date('2018-05-18T10:22:20Z') },
      { ...second, invoiceNo: 'FAC 001/20' },
      { ...second, grossTotal: '75.01' },
      { ...second, previousHash: firstHash.slice(1) },
    ]) expect(service.verify(changed, signed.hash, pair.publicKey)).toBe(false);
  });

  it('separa cadeias por hash anterior e rejeita chave não configurada', () => {
    const service = new FiscalSignatureService();
    const a = service.sign({ ...first, invoiceNo: 'FT A/1' });
    const b = service.sign({ ...first, invoiceNo: 'FT B/1' });
    expect(a.hash).not.toBe(b.hash);
    delete process.env.FISCAL_SIGNATURE_PRIVATE_KEY;
    expect(service.configuration().configured).toBe(false);
    expect(() => service.sign(first)).toThrow();
  });
});
