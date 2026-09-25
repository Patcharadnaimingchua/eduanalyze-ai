import type { StudentInvitationPreview } from '@eduanalyze-ai/shared-types';
import { apiClient } from '../api-client';

// Public endpoint — no auth header needed, but apiClient sends whatever it
// has anyway; the backend route itself has no guard.
export async function fetchInvitationPreview(token: string) {
  const { data } = await apiClient.get<StudentInvitationPreview>(
    `/auth/invitation/${token}`,
  );
  return data;
}
