import { isAxiosError } from 'axios';

const GENERIC = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';

// Read endpoints for the curriculum tree aren't scope-filtered, so a staff
// member can open a curriculum outside their scope and only learn about it
// when a write comes back 403 — say that, instead of the generic message.
export function describeStaffWriteError(error: unknown, fallback: string = GENERIC): string {
  if (isAxiosError(error) && error.response?.status === 403) {
    return 'คุณไม่มีสิทธิ์แก้ไขหลักสูตรนี้ — อยู่นอกขอบเขตที่คุณดูแล';
  }
  return fallback;
}
