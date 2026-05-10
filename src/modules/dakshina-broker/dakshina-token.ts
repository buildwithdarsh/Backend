import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

/**
 * Shared dakshina-broker token format. Identical implementation lives in the
 * Khwahish (originator) and Website (iframe host) repos so all three apps can
 * mint or verify the same AES-256-GCM token. The secret comes from
 * DAKSHINA_BROKER_SECRET; the encryption key is sha256(secret).
 */

export interface DakshinaTokenPayload {
  app: string;
  callbackId: string;
  fingerprint: string;
  shraapId: string;
  amountInr: number;
  exp: number; // unix seconds
}

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env['DAKSHINA_BROKER_SECRET'];
  if (!secret) throw new Error('DAKSHINA_BROKER_SECRET is not set');
  return createHash('sha256').update(secret, 'utf8').digest();
}

export function mintDakshinaToken(
  payload: Omit<DakshinaTokenPayload, 'exp'> & { ttlSeconds?: number },
): string {
  const ttl = payload.ttlSeconds ?? 60 * 30;
  const body: DakshinaTokenPayload = {
    app: payload.app,
    callbackId: payload.callbackId,
    fingerprint: payload.fingerprint,
    shraapId: payload.shraapId,
    amountInr: payload.amountInr,
    exp: Math.floor(Date.now() / 1000) + ttl,
  };
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(body), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ciphertext, tag]).toString('base64url');
}

export function verifyDakshinaToken(token: string): DakshinaTokenPayload {
  const buf = Buffer.from(token, 'base64url');
  if (buf.length < IV_LENGTH + TAG_LENGTH + 1) throw new Error('token: malformed');
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(buf.length - TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH, buf.length - TAG_LENGTH);
  const decipher = createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(tag);
  let plaintext: Buffer;
  try {
    plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new Error('token: bad signature');
  }
  const payload = JSON.parse(plaintext.toString('utf8')) as DakshinaTokenPayload;
  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('token: expired');
  }
  return payload;
}
