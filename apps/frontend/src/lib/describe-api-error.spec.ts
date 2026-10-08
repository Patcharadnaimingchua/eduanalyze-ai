import { AxiosError, AxiosHeaders } from 'axios';
import { GENERIC_ERROR, describeApiError } from './describe-api-error';

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

  it('joins a list of messages', () => {
    expect(describeApiError(httpError(400, { message: ['ก', 'ข'] }))).toBe('ก · ข');
  });

  it('uses the caller sentence for a status it knows, before the server message', () => {
    expect(describeApiError(httpError(409, { message: 'Conflict' }), { 409: 'อีเมลซ้ำ' })).toBe(
      'อีเมลซ้ำ',
    );
  });

  it('falls back when a 4xx has no usable message', () => {
    expect(describeApiError(httpError(400))).toBe(GENERIC_ERROR);
    expect(describeApiError(httpError(400, { message: '  ' }))).toBe(GENERIC_ERROR);
    expect(describeApiError(httpError(404, { message: 42 }))).toBe(GENERIC_ERROR);
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

  it('accepts a custom fallback', () => {
    expect(describeApiError(httpError(500), {}, 'สร้างไม่สำเร็จ')).toBe('สร้างไม่สำเร็จ');
  });
});
