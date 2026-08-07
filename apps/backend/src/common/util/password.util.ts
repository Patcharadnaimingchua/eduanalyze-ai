import { randomInt } from 'crypto';
import * as bcrypt from 'bcryptjs';

export const PASSWORD_SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, PASSWORD_SALT_ROUNDS);
}

const TEMP_PASSWORD_CHARS =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

// Server-generated temp password for Module 12's admin-creates-user flow
// (no email service to send a self-service invite link through). Built to
// satisfy the same complexity rule enforced everywhere else (passwordSchema/
// ChangePasswordDto: 8+ chars, at least one lowercase/uppercase/digit) so
// it behaves like any password a user could later choose via
// PATCH /auth/change-password.
export function generateTempPassword(): string {
  const random = Array.from({ length: 9 }, () =>
    TEMP_PASSWORD_CHARS[randomInt(TEMP_PASSWORD_CHARS.length)],
  ).join('');
  // Guarantees at least one of each required character class regardless
  // of what the random draw produced, without weakening the rest.
  return `Aa1${random}`;
}
