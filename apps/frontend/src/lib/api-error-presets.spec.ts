import { AxiosError, AxiosHeaders } from 'axios';
import {
  GRADE_WRITE_ERRORS,
  GRADE_WRITE_FALLBACK,
  OWN_SENTENCE_ONLY,
  RATE_LIMITED_ERROR,
  STAFF_WRITE_ERRORS,
  orgWriteErrors,
} from './api-error-presets';
import { describeApiError } from './describe-api-error';

function httpError(status: number, data?: unknown) {
  return new AxiosError('x', 'ERR', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });
}

describe('write error presets', () => {
  it('staff: 403 names the scope, any other failure is the caller sentence', () => {
    const say = (e: unknown) =>
      describeApiError(e, STAFF_WRITE_ERRORS, 'ถอนไม่สำเร็จ', OWN_SENTENCE_ONLY);
    expect(say(httpError(403))).toBe(STAFF_WRITE_ERRORS[403]);
    expect(say(httpError(400, { message: 'ข้อความจากเซิร์ฟเวอร์' }))).toBe('ถอนไม่สำเร็จ');
    expect(say(new Error('network'))).toBe('ถอนไม่สำเร็จ');
  });

  it('grades: 403 and 404 have their own sentence, the rest is the save fallback', () => {
    const say = (e: unknown) =>
      describeApiError(e, GRADE_WRITE_ERRORS, GRADE_WRITE_FALLBACK, OWN_SENTENCE_ONLY);
    expect(say(httpError(403))).toBe(GRADE_WRITE_ERRORS[403]);
    expect(say(httpError(404))).toBe(GRADE_WRITE_ERRORS[404]);
    expect(say(httpError(500))).toBe(GRADE_WRITE_FALLBACK);
  });

  it('organisation: the caller names the 409; other 4xx may show the Thai server sentence', () => {
    const errors = orgWriteErrors('ซ้ำ');
    expect(describeApiError(httpError(409), errors)).toBe('ซ้ำ');
    expect(describeApiError(httpError(404), errors)).toBe(errors[404]);
    expect(describeApiError(httpError(422, { message: 'ชื่อสั้นเกินไป' }), errors)).toBe(
      'ชื่อสั้นเกินไป',
    );
  });

  it('sign-in forms: a throttled request tells the user to wait, other failures keep their own sentence', () => {
    const errors = { ...RATE_LIMITED_ERROR, 401: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
    const say = (e: unknown) => describeApiError(e, errors, undefined, OWN_SENTENCE_ONLY);
    expect(say(httpError(429))).toBe('ลองบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่');
    expect(say(httpError(401))).toBe('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    expect(say(httpError(500))).toBe('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
  });
});
