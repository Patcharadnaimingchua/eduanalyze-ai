import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RequestUser } from '../../auth/request-user.interface';

export const ADMIN_STAFF_ONLY_MESSAGE =
  'ผู้ดูแลระบบ (ADMIN) จัดการได้เฉพาะบัญชีเจ้าหน้าที่ (STAFF) เท่านั้น';

// SUPER_ADMIN is exempt; an ADMIN may only act on accounts that hold STAFF
// and neither ADMIN nor SUPER_ADMIN.
export function assertMayManageTarget(targetRoles: Role[], requester: RequestUser): void {
  if (requester.roles.includes('SUPER_ADMIN')) return;
  const isStaffOnly =
    targetRoles.includes('STAFF') &&
    !targetRoles.includes('ADMIN') &&
    !targetRoles.includes('SUPER_ADMIN');
  if (!isStaffOnly) {
    throw new ForbiddenException(ADMIN_STAFF_ONLY_MESSAGE);
  }
}
