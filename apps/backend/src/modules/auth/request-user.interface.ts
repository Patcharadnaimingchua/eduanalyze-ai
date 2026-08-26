import { Role } from '@prisma/client';

// Shape attached to `request.user` by JwtStrategy.validate() — consumed
// by RolesGuard and the @CurrentUser() decorator.
export interface RequestUser {
  userId: string;
  email: string;
  roles: Role[];
  mustChangePassword: boolean;
}
