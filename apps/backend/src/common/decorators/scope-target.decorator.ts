import { SetMetadata } from '@nestjs/common';

export type ScopeTargetEntity =
  | 'faculty'
  | 'department'
  | 'program'
  | 'curriculum'
  | 'course'
  | 'plo'
  | 'clo'
  | 'cloPloMapping'
  | 'courseCategory'
  | 'curriculumRequirement'
  | 'prerequisite';

export interface ScopeTargetSource {
  from: 'param' | 'body';
  key: string;
}

export const SCOPE_TARGET_KEY = 'scopeTarget';

export const ScopeTarget = (
  entity: ScopeTargetEntity,
  source: ScopeTargetSource,
) => SetMetadata(SCOPE_TARGET_KEY, { entity, source });
