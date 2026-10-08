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

// The one place an API error becomes the sentence the user reads (used across
// /admin/**). A 4xx means the request itself was refused, so the server's own
// message is shown; `byStatus` lets a caller put a more specific sentence on a
// status it knows (e.g. 409 on this form). 5xx, a network failure, a non-HTTP
// error or an empty message all give the generic sentence.
export function describeApiError(
  error: unknown,
  byStatus: Partial<Record<number, string>> = {},
  fallback: string = GENERIC_ERROR,
): string {
  if (!isAxiosError(error) || !error.response) return fallback;
  const { status, data } = error.response;
  if (status < 400 || status >= 500) return fallback;
  return byStatus[status] ?? serverMessage(data) ?? fallback;
}
