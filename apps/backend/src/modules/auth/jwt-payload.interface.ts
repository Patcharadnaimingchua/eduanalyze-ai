import { Role } from '@prisma/client';

// Shared shape signed into both access and refresh tokens. Deliberately
// excludes UserScope — CONVENTIONS.md §8 requires scope to be resolved
// live (with an isActive check on the target entity) on every request,
// so embedding a scope snapshot here would go stale the moment a scope's
// target Faculty/Department/Program is soft-deleted.
export interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
}
