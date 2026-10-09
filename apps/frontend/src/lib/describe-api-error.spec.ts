import { AxiosError, AxiosHeaders } from 'axios';
import { GENERIC_ERROR, INVALID_INPUT_ERROR, describeApiError } from './describe-api-error';

function httpError(status: number, data?: unknown) {
  return new AxiosError('x', 'ERR', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });
}

describe('describeApiError', () => {
  it('shows the server message for a 4xx', () => {
    expect(describeApiError(httpError(403, { message: 'ผู้ใช้นี้อยู่นอกขอบเขต' }))).toBe(
      'ผู้ใช้นี้อยู่นอกขอบเขต',
    );
  });

  it('joins a list of messages when they are Thai', () => {
    expect(describeApiError(httpError(400, { message: ['ก', 'ข'] }))).toBe('ก · ข');
  });

  it('uses the caller sentence for a status it knows, before the server message', () => {
    expect(describeApiError(httpError(409, { message: 'Conflict' }), { 409: 'อีเมลซ้ำ' })).toBe(
      'อีเมลซ้ำ',
    );
  });

  it('ignores an English-only message: invalid-input sentence for 400/422, generic otherwise', () => {
    expect(describeApiError(httpError(400, { message: 'email must be an email' }))).toBe(
      INVALID_INPUT_ERROR,
    );
    expect(describeApiError(httpError(422, { message: ['name should not be empty'] }))).toBe(
      INVALID_INPUT_ERROR,
    );
    expect(describeApiError(httpError(403, { message: 'Forbidden' }))).toBe(GENERIC_ERROR);
    expect(describeApiError(httpError(404, { message: 'Not Found' }))).toBe(GENERIC_ERROR);
  });

  it('treats an empty or missing message like English-only', () => {
    expect(describeApiError(httpError(400))).toBe(INVALID_INPUT_ERROR);
    expect(describeApiError(httpError(400, { message: '  ' }))).toBe(INVALID_INPUT_ERROR);
    expect(describeApiError(httpError(404, { message: 42 }))).toBe(GENERIC_ERROR);
  });

  it('shows a mixed Thai and English message', () => {
    expect(describeApiError(httpError(403, { message: 'ไม่มีสิทธิ์ (scope)' }))).toBe(
      'ไม่มีสิทธิ์ (scope)',
    );
  });

  it('gives the generic sentence for a 5xx, even with a message', () => {
    expect(describeApiError(httpError(500, { message: 'Internal error' }))).toBe(GENERIC_ERROR);
    expect(describeApiError(httpError(503, { message: 'x' }), { 503: 'y' })).toBe(GENERIC_ERROR);
  });

  it('gives the generic sentence for a network failure or a non-HTTP error', () => {
    expect(describeApiError(new AxiosError('Network Error', 'ERR_NETWORK'))).toBe(GENERIC_ERROR);
    expect(describeApiError(new Error('boom'))).toBe(GENERIC_ERROR);
    expect(describeApiError(undefined)).toBe(GENERIC_ERROR);
  });

  it('accepts a custom fallback, which also replaces the invalid-input sentence', () => {
    expect(describeApiError(httpError(500), {}, 'สร้างไม่สำเร็จ')).toBe('สร้างไม่สำเร็จ');
    expect(describeApiError(httpError(400, { message: 'bad' }), {}, 'สร้างไม่สำเร็จ')).toBe(
      'สร้างไม่สำเร็จ',
    );
  });

  it("with serverMessage off, a Thai server sentence never replaces the caller's own", () => {
    const error = httpError(404, { message: 'ไม่พบข้อมูลนี้' });
    expect(describeApiError(error, {}, 'บันทึกไม่สำเร็จ', { serverMessage: false })).toBe(
      'บันทึกไม่สำเร็จ',
    );
    expect(
      describeApiError(error, { 404: 'หายไปแล้ว' }, 'บันทึกไม่สำเร็จ', { serverMessage: false }),
    ).toBe('หายไปแล้ว');
    expect(describeApiError(error, {}, undefined, { serverMessage: false })).toBe(GENERIC_ERROR);
  });
});
