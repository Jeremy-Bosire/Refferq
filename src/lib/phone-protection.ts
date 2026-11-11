import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from 'node:crypto';

function deriveKey(purpose: 'phone-encryption' | 'phone-lookup' | 'phone-otp' | 'kyc-encryption' | 'kyc-lookup'): Buffer {
  const master = process.env.PII_MASTER_KEY || process.env.JWT_SECRET;
  if (!master || master.length < 32) throw new Error('A stable PII_MASTER_KEY or 32-character JWT_SECRET is required');
  return Buffer.from(hkdfSync('sha256', master, 'ganjilink-pii-v1', purpose, 32));
}

function encryptWithKey(value: string, keyPurpose: Parameters<typeof deriveKey>[0]): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(keyPurpose), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), ciphertext.toString('base64url')].join('.');
}

function decryptWithKey(encrypted: string, keyPurpose: Parameters<typeof deriveKey>[0]): string {
  const [version, encodedIv, encodedTag, encodedCiphertext] = encrypted.split('.');
  if (version !== 'v1' || !encodedIv || !encodedTag || !encodedCiphertext) {
    throw new TypeError('Unsupported encrypted PII format');
  }
  const decipher = createDecipheriv('aes-256-gcm', deriveKey(keyPurpose), Buffer.from(encodedIv, 'base64url'));
  decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

/** Encrypt phone PII with authenticated AES-256-GCM. Keep the master key stable. */
export function encryptPhone(phoneE164: string): string {
  return encryptWithKey(phoneE164, 'phone-encryption');
}

export function decryptPhone(encrypted: string): string {
  return decryptWithKey(encrypted, 'phone-encryption');
}

/** Stable keyed digest permits uniqueness checks without indexing plaintext PII. */
export function hashPhone(phoneE164: string): string {
  return createHmac('sha256', deriveKey('phone-lookup')).update(phoneE164).digest('hex');
}

export function hashPhoneOtp(userId: string, code: string): string {
  return createHmac('sha256', deriveKey('phone-otp')).update(`${userId}:${code}`).digest('hex');
}

/** KYC identity data uses keys distinct from the phone encryption and lookup keys. */
export function encryptKycValue(value: string): string {
  return encryptWithKey(value, 'kyc-encryption');
}

export function decryptKycValue(encrypted: string): string {
  return decryptWithKey(encrypted, 'kyc-encryption');
}

export function hashIdentityDocument(type: 'NATIONAL_ID' | 'PASSPORT', documentNumber: string): string {
  const normalized = documentNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return createHmac('sha256', deriveKey('kyc-lookup')).update(`${type}:${normalized}`).digest('hex');
}

export function maskPhone(phoneE164: string): string {
  return `${phoneE164.slice(0, 4)}•••••${phoneE164.slice(-4)}`;
}
