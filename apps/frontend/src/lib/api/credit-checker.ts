import type { CreditCheckReport } from '@eduanalyze-ai/shared-types';
import { apiClient } from '../api-client';

export async function fetchCreditCheck(studentProfileId: string) {
  const { data } = await apiClient.get<CreditCheckReport>(`/credit-checker/${studentProfileId}`);
  return data;
}
