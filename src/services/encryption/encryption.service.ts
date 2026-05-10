import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm' as const;
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag
const SEPARATOR = ':';

@Injectable()
export class EncryptionService {
  private readonly masterKey: Buffer;

  constructor() {
    const hexKey = process.env['ENCRYPTION_KEY'];
    if (!hexKey) {
      throw new Error(
        'ENCRYPTION_KEY environment variable is required (64-char hex string = 32 bytes)',
      );
    }
    if (hexKey.length !== 64) {
      throw new Error(
        `ENCRYPTION_KEY must be a 64-character hex string (got ${hexKey.length} chars)`,
      );
    }
    this.masterKey = Buffer.from(hexKey, 'hex');
  }

  /**
   * Encrypt a plaintext string using AES-256-GCM.
   *
   * @returns Base64-encoded string in the format `iv:authTag:ciphertext`
   * where each segment is individually base64-encoded before joining.
   */
  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.masterKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join(SEPARATOR);
  }

  /**
   * Decrypt a ciphertext string previously produced by {@link encrypt}.
   *
   * @param ciphertext Base64-encoded `iv:authTag:encrypted` string.
   * @returns The original plaintext.
   */
  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(SEPARATOR);
    if (parts.length !== 3) {
      throw new Error(
        'Invalid ciphertext format — expected iv:authTag:encrypted',
      );
    }

    const [ivB64, authTagB64, encryptedB64] = parts as [string, string, string];
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const encrypted = Buffer.from(encryptedB64, 'base64');

    const decipher = createDecipheriv(ALGORITHM, this.masterKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
