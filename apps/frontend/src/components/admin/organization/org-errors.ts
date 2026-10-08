import { describeApiError } from '@/lib/describe-api-error';

// Known statuses keep their organisation-specific sentence; any other 4xx shows
// the server's own message, and 5xx/network failures the generic one.
export function describeOrgWriteError(error: unknown, conflictMessage: string) {
  return describeApiError(error, {
    409: conflictMessage,
    403: 'คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้',
    404: 'ไม่พบรายการนี้แล้ว อาจถูกปิดใช้งานไปก่อนหน้า',
  });
}
