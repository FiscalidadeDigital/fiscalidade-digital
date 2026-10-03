import { BadRequestException } from '@nestjs/common';
import { generateKeyPairSync, verify } from 'node:crypto';
import { AgtJwsService } from './agt-jws.service';

describe('AgtJwsService', () => {
  it('creates a compact RS256 JWS with canonical payload and a verifiable signature', () => {
    const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const privateKey = keys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    const token = new AgtJwsService().sign({ z: 1, nested: { b: 2, a: 1 }, a: 'AO' }, privateKey);
    const [header, payload, signature] = token.split('.');
    expect(JSON.parse(Buffer.from(header, 'base64url').toString())).toEqual({ alg: 'RS256', typ: 'JWT' });
    expect(Buffer.from(payload, 'base64url').toString()).toBe('{"a":"AO","nested":{"a":1,"b":2},"z":1}');
    expect(verify('RSA-SHA256', Buffer.from(`${header}.${payload}`), keys.publicKey, Buffer.from(signature, 'base64url'))).toBe(true);
  });

  it('rejects RSA keys smaller than the official minimum', () => {
    const keys = generateKeyPairSync('rsa', { modulusLength: 1024 });
    const privateKey = keys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    expect(() => new AgtJwsService().sign({ a: 1 }, privateKey)).toThrow(BadRequestException);
  });
});
