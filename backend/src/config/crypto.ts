import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM: authenticated encryption.
// Key must be 32 bytes (256 bits). Provided as 64-char hex in env var TC_KEY.

function getKey(): Buffer {
  const hex = process.env.TC_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'TC_KEY env var must be a 64-character hex string (32 bytes). ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypts a string with AES-256-GCM.
 * Returns "iv:authTag:ciphertext", all base64.
 */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(12); // 96-bit IV is standard for GCM
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
}

/**
 * Decrypts a string produced by encrypt().
 * Throws if the auth tag doesn't match (tampering or wrong key).
 */
export function decrypt(encoded: string): string {
  const [ivB64, tagB64, ctB64] = encoded.split(':');
  if (!ivB64 || !tagB64 || !ctB64) {
    throw new Error('Malformed encrypted value');
  }
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(ctB64, 'base64');

  const decipher = createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}