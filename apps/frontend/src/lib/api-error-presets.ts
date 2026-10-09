import type { DescribeApiErrorOptions } from '@/lib/describe-api-error';

// Sentences and options the write forms pass to describeApiError, kept in one
// place so the same status reads the same way wherever it appears.

// For callers whose own sentence should win over whatever the server says.
export const OWN_SENTENCE_ONLY: DescribeApiErrorOptions = {
  serverMessage: false,
};

// Read endpoints for the curriculum tree aren't scope-filtered, so a staff
// member can open a curriculum outside their scope and only learn about it
// when a write comes back 403.
export const STAFF_WRITE_ERRORS: Partial<Record<number, string>> = {
  403: 'คุณไม่มีสิทธิ์แก้ไขหลักสูตรนี้ — อยู่นอกขอบเขตที่คุณดูแล',
};

export const GRADE_WRITE_ERRORS: Partial<Record<number, string>> = {
  403: 'คุณไม่มีสิทธิ์แก้ไขผลการเรียนของรายวิชานี้',
  404: 'ไม่พบรายการนี้แล้ว อาจถูกลบไปก่อนหน้า',
};
export const GRADE_WRITE_FALLBACK = 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';

// Organisation writes: the caller names what a 409 means for that form.
export function orgWriteErrors(conflictMessage: string): Partial<Record<number, string>> {
  return {
    409: conflictMessage,
    403: 'คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้',
    404: 'ไม่พบรายการนี้แล้ว อาจถูกปิดใช้งานไปก่อนหน้า',
  };
}

// The API throttles sign-in, registration and password endpoints per minute.
export const RATE_LIMITED_ERROR: Partial<Record<number, string>> = {
  429: 'ลองบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่',
};
