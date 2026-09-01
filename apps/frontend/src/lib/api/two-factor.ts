import type {
  LoginResponse,
  TwoFactorDisableRequest,
  TwoFactorEnableRequest,
  TwoFactorEnableResponse,
  TwoFactorSetupResponse,
  TwoFactorVerifyRequest,
} from '@eduanalyze-ai/shared-types';
import { apiClient } from '../api-client';

// Wraps the 4 2FA endpoints. setup/enable/disable are called with the
// normal (already-logged-in) session, same as any other authenticated
// call — apiClient's request interceptor attaches the real access token
// automatically, nothing special needed here.
export async function setupTwoFactor() {
  const { data } = await apiClient.post<TwoFactorSetupResponse>('/auth/2fa/setup');
  return data;
}

export async function enableTwoFactor(dto: TwoFactorEnableRequest) {
  const { data } = await apiClient.post<TwoFactorEnableResponse>('/auth/2fa/enable', dto);
  return data;
}

export async function disableTwoFactor(dto: TwoFactorDisableRequest) {
  await apiClient.post('/auth/2fa/disable', dto);
}

// The one call in this file NOT made with the normal session — at this
// point in the login flow there is no real access token yet, only the
// short-lived pendingToken from POST /auth/login. apiClient's request
// interceptor only overwrites the Authorization header when it holds a
// real access token (it doesn't yet, mid-login), so passing it explicitly
// here goes through untouched.
export async function verifyTwoFactor(pendingToken: string, dto: TwoFactorVerifyRequest) {
  const { data } = await apiClient.post<LoginResponse>('/auth/2fa/verify', dto, {
    headers: { Authorization: `Bearer ${pendingToken}` },
  });
  return data;
}
