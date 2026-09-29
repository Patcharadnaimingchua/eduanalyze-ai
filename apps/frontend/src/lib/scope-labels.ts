import type { ScopeLevel } from '@eduanalyze-ai/shared-types';

// PROGRAM is "สาขา" to match the org structure page, profile and student
// directory. "หลักสูตร" means Curriculum there, and there is no
// curriculum-level scope.
export const SCOPE_LEVEL_LABELS: Record<ScopeLevel, string> = {
  FACULTY: 'คณะ',
  DEPARTMENT: 'ภาควิชา',
  PROGRAM: 'สาขา',
};
