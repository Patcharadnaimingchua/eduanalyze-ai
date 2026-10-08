import { useQuery } from '@tanstack/react-query';
import { fetchAdminScopeOverview, fetchSystemCurriculumOverview } from '@/lib/api/admin';
import { directoryFromScopeOverview, directoryFromSystemOverview } from '@/lib/admin-curricula';

// The Admin's scoped list, or every curriculum for a Super Admin (the scope
// overview endpoint is Admin-only). Each keeps its existing cache key.
export function useCurriculumDirectory(isSuperAdmin: boolean) {
  const scoped = useQuery({
    queryKey: ['admin-scope-overview'],
    queryFn: fetchAdminScopeOverview,
    select: directoryFromScopeOverview,
    enabled: !isSuperAdmin,
  });
  const system = useQuery({
    queryKey: ['system-curriculum-overview'],
    queryFn: fetchSystemCurriculumOverview,
    select: directoryFromSystemOverview,
    enabled: isSuperAdmin,
  });
  return isSuperAdmin ? system : scoped;
}
