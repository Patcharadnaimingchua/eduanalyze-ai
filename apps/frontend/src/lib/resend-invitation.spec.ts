import { AxiosError } from 'axios';
import {
  canResendInvitation,
  describeResendError,
  RESEND_EMAIL_FAILED,
  RESEND_TOO_OFTEN,
} from './resend-invitation';

const pending = { roles: ['STAFF' as const], mustChangePassword: true, isActive: true };

describe('canResendInvitation', () => {
  it('offers it to a Super Admin for any account that has not set a password', () => {
    expect(
      canResendInvitation({
        isSelf: false,
        requesterIsSuperAdmin: true,
        user: { ...pending, roles: ['ADMIN'] },
      }),
    ).toBe(true);
  });

  it('offers it to an Admin only for STAFF-only accounts', () => {
    const base = { isSelf: false, requesterIsSuperAdmin: false };
    expect(canResendInvitation({ ...base, user: pending })).toBe(true);
    expect(canResendInvitation({ ...base, user: { ...pending, roles: ['STAFF', 'ADMIN'] } })).toBe(
      false,
    );
    expect(canResendInvitation({ ...base, user: { ...pending, roles: ['INSTRUCTOR'] } })).toBe(
      false,
    );
  });

  it('hides it for yourself, for accounts with a password, and for suspended ones', () => {
    const base = { isSelf: false, requesterIsSuperAdmin: true };
    expect(canResendInvitation({ ...base, isSelf: true, user: pending })).toBe(false);
    expect(canResendInvitation({ ...base, user: { ...pending, mustChangePassword: false } })).toBe(
      false,
    );
    expect(canResendInvitation({ ...base, user: { ...pending, isActive: false } })).toBe(false);
  });
});

function apiError(status: number, message: string) {
  return new AxiosError('failed', 'ERR', undefined, undefined, {
    status,
    data: { message },
  } as never);
}

describe('describeResendError', () => {
  it('shows the Thai 409 sentence from the server', () => {
    const message = 'ผู้ใช้นี้ตั้งรหัสผ่านแล้ว จึงส่งคำเชิญซ้ำไม่ได้';
    expect(describeResendError(apiError(409, message))).toBe(message);
  });

  it('names the mail failure on 503 and the rate limit on 429', () => {
    expect(describeResendError(apiError(503, 'ส่งอีเมลไม่สำเร็จ'))).toBe(RESEND_EMAIL_FAILED);
    expect(describeResendError(apiError(429, 'ThrottlerException'))).toBe(RESEND_TOO_OFTEN);
  });

  it('never shows English text', () => {
    expect(describeResendError(new Error('Network Error'))).not.toMatch(/[A-Za-z]/);
  });
});
