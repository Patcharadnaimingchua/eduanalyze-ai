import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // recommended IV length for GCM
const KEY_LENGTH_BYTES = 32; // AES-256

// First (and so far only) secret-at-rest encryption in this codebase —
// used exclusively for TwoFactorCredential.secretCiphertext (see
// schema.prisma's comment on that model). Unlike password hashing
// (one-way, bcrypt), a TOTP secret must be recoverable in plaintext to
// verify a login code, so it's encrypted rather than hashed.
//
// Output format: "<iv>:<authTag>:<ciphertext>", each hex-encoded and
// colon-joined into one string so a single database column holds
// everything decrypt() needs — no separate iv/authTag columns.
export function encryptSecret(plainText: string, hexKey: string): string {
  const key = parseKey(hexKey);
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('hex'), authTag.toString('hex'), ciphertext.toString('hex')].join(':');
}

export function decryptSecret(encrypted: string, hexKey: string): string {
  const key = parseKey(hexKey);
  const [ivHex, authTagHex, ciphertextHex] = encrypted.split(':');
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error('Malformed encrypted secret — expected "<iv>:<authTag>:<ciphertext>"');
  }
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const plainText = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ]);
  return plainText.toString('utf8');
}

// Same "no ambiguous characters" alphabet as generateTempPassword's
// TEMP_PASSWORD_CHARS (password.util.ts) — excludes 0/O/1/I/l so a code
// read off a screen or printed page is never misread. Format "XXXX-XXXX"
// (8 chars + separator) — the dash also doubles as a cheap way to tell a
// recovery code apart from a 6-digit TOTP code at the TwoFactorService
// verify step, before doing any hashing/decryption work.
const RECOVERY_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const RECOVERY_CODE_FORMAT = /^[A-Z2-9]{4}-[A-Z2-9]{4}$/;

export function generateRecoveryCodes(count: number): string[] {
  return Array.from({ length: count }, generateOneRecoveryCode);
}

function generateOneRecoveryCode(): string {
  const chars = Array.from(
    { length: 8 },
    () => RECOVERY_CODE_CHARS[randomInt(RECOVERY_CODE_CHARS.length)],
  );
  return `${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`;
}

export function isRecoveryCodeFormat(value: string): boolean {
  return RECOVERY_CODE_FORMAT.test(value.toUpperCase());
}

// One-way hash (sha256), same approach as PasswordResetToken.tokenHash —
// recovery codes are never stored in plaintext, only compared by hash.
export function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(code.toUpperCase()).digest('hex');
}

function parseKey(hexKey: string): Buffer {
  const key = Buffer.from(hexKey, 'hex');
  if (key.length !== KEY_LENGTH_BYTES) {
    // Fails loudly at first use rather than silently truncating/padding —
    // a wrong-length key is a misconfiguration (see TOTP_ENCRYPTION_KEY in
    // .env.example: must be `openssl rand -hex 32`, 64 hex chars).
    throw new Error(
      `TOTP_ENCRYPTION_KEY must decode to exactly ${KEY_LENGTH_BYTES} bytes (64 hex chars) — got ${key.length}`,
    );
  }
  return key;
}
