import type {
  CreateCreditLimitRequestRequest,
  CreditLimitRequest,
} from '@eduanalyze-ai/shared-types';
import { apiClient } from '../api-client';

export async function fetchMyCreditLimitRequest(): Promise<CreditLimitRequest | null> {
  const { data } = await apiClient.get<CreditLimitRequest | null>('/credit-limit-requests/me');
  return data;
}

export async function upsertCreditLimitRequest(
  payload: CreateCreditLimitRequestRequest,
): Promise<CreditLimitRequest> {
  const { data } = await apiClient.post<CreditLimitRequest>('/credit-limit-requests/me', payload);
  return data;
}

export async function deleteCreditLimitRequest(): Promise<void> {
  await apiClient.delete('/credit-limit-requests/me');
}
