import { isAxiosError } from 'axios';

export function describeOrgWriteError(error: unknown, conflictMessage: string) {
  if (isAxiosError(error)) {
    if (error.response?.status === 409) return conflictMessage;
    if (error.response?.status === 403) return 'คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้';
    if (error.response?.status === 404) return 'ไม่พบรายการนี้แล้ว อาจถูกปิดใช้งานไปก่อนหน้า';
  }
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}
