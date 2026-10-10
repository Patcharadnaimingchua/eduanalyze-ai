import { isAxiosError } from 'axios';
import type { AdminUserSummary } from '@eduanalyze-ai/shared-types';
import { describeApiError } from '@/lib/describe-api-error';
import { isStaffOnlyTarget } from '@/lib/admin-user-guard';

// "Resend invitation" = email a fresh password-setup link to an account that
// has not set a password yet. Mirrors UserManagementService.resendInvitation so
// the button is only offered where the API would accept it; the API stays the
// authority.

export const RESEND_EMAIL_FAILED = 'ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่อีกครั้งภายหลัง';
export const RESEND_TOO_OFTEN = 'ส่งบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่';

// mustChangePassword is true from creation until the user sets a password.
export function canResendInvitation(input: {
  isSelf: boolean;
  requesterIsSuperAdmin: boolean;
  user: Pick<AdminUserSummary, 'roles' | 'mustChangePassword' | 'isActive'>;
}): boolean {
  if (input.isSelf || !input.user.isActive || !input.user.mustChangePassword) return false;
  return input.requesterIsSuperAdmin || isStaffOnlyTarget(input.user.roles);
}

// describeApiError answers every 5xx with its generic sentence, but a 503 here
// has one cause the user can act on (the mail server), so it gets its own.
export function describeResendError(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 429) return RESEND_TOO_OFTEN;
    if (status !== undefined && status >= 500) return RESEND_EMAIL_FAILED;
  }
  return describeApiError(error);
}
