import { isAxiosError } from 'axios';

export const GENERIC_ERROR = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';

function serverMessage(data: unknown): string | null {
  const message = (data as { message?: unknown } | null | undefined)?.message;
  if (typeof message === 'string') return message.trim() || null;
  if (Array.isArray(message)) {
    const parts = message.filter((m): m is string => typeof m === 'string' && m.trim() !== '');
    return parts.length > 0 ? parts.join(' · ') : null;
  }
  return null;
}

// The server's message is shown only when it is written in Thai: the API also
// returns English validation text, which this app's users cannot act on.
const THAI = /[\u0E00-\u0E7F]/;
export const INVALID_INPUT_ERROR = 'ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่อีกครั้ง';

// The one place an API error becomes the sentence the user reads (used across
// /admin/**). A 4xx means the request itself was refused, so a Thai server
// message is shown; `byStatus` lets a caller put a more specific sentence on a
// status it knows (e.g. 409 on this form). Otherwise a 400/422 reads as invalid
// input and anything else, including 5xx, a network failure or a non-HTTP
// error, gets the generic sentence. An explicit `fallback` replaces both.
export function describeApiError(
  error: unknown,
  byStatus: Partial<Record<number, string>> = {},
  fallback?: string,
): string {
  const generic = fallback ?? GENERIC_ERROR;
  if (!isAxiosError(error) || !error.response) return generic;
  const { status, data } = error.response;
  if (status < 400 || status >= 500) return generic;
  const message = serverMessage(data);
  if (byStatus[status]) return byStatus[status];
  if (message && THAI.test(message)) return message;
  return fallback ?? (status === 400 || status === 422 ? INVALID_INPUT_ERROR : GENERIC_ERROR);
}
