import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ScopeResolverService } from '../../../common/scope/scope-resolver.service';
import {
  generateTempPassword,
  hashPassword,
} from '../../../common/util/password.util';
import { RequestUser } from '../../auth/request-user.interface';
import { PendingInvitationService } from '../../auth/pending-invitation.service';
import { UserService } from '../user/user.service';
import { UserRoleService } from '../user-role/user-role.service';
import { UserScopeService } from '../user-scope/user-scope.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly userRoleService: UserRoleService,
    private readonly userScopeService: UserScopeService,
    private readonly scopeResolverService: ScopeResolverService,
    private readonly pendingInvitationService: PendingInvitationService,
  ) {}

  async createStaffOrAdmin(dto: CreateUserDto, requester: RequestUser) {
    // STUDENT is /auth/register-only — never a second code path that can
    // create a student account (CONVENTIONS.md §6).
    if (dto.role === 'STUDENT') {
      throw new BadRequestException(
        'STUDENT accounts must be created via /auth/register',
      );
    }

    const isSuperAdmin = requester.roles.includes('SUPER_ADMIN');
    if (!isSuperAdmin) {
      // RolesGuard already restricted this route to SUPER_ADMIN|ADMIN, so
      // reaching here as non-SUPER_ADMIN means the requester is ADMIN.
      if (dto.role !== 'STAFF') {
        throw new ForbiddenException('ADMIN may only create STAFF accounts');
      }
      if (!dto.scope) {
        throw new BadRequestException(
          'scope is required when creating a user as ADMIN',
        );
      }

      const ancestry = await this.scopeResolverService.resolveAncestryForLevel(
        dto.scope.level,
        dto.scope.targetId,
      );
      const effectiveScopes = await this.scopeResolverService.getEffectiveScopes(
        requester.userId,
      );
      if (!this.scopeResolverService.isCovered(ancestry, effectiveScopes)) {
        throw new ForbiddenException(
          'You do not have scope covering this grant',
        );
      }
    }

    // No email service (see TODO.md) — the requester sets a usable
    // password directly rather than issuing an invitation the new user
    // would need email access to redeem. Generated before the transaction
    // since it doesn't depend on anything created inside it.
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await this.userService.create(
        dto.email,
        passwordHash,
        dto.fullName,
        tx,
        true, // mustChangePassword — server-generated temp password, must be changed on first use
      );
      await this.userRoleService.assignRole(createdUser.id, dto.role, tx);
      if (dto.scope) {
        await this.userScopeService.assignScope(
          createdUser.id,
          dto.scope.level,
          dto.scope.targetId,
          tx,
        );
      }
      return createdUser;
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      tempPassword,
    };
  }

  async listUsers(requester: RequestUser) {
    if (requester.roles.includes('SUPER_ADMIN')) {
      const users = await this.userService.findAll({
        userRoles: { none: { role: 'STUDENT' } },
      });
      return users.map((user) => this.toSummary(user));
    }

    const users = await this.userService.findAll({
      userRoles: { none: { role: 'STUDENT' } },
      scopes: { some: { OR: await this.buildScopeOrFilter(requester.userId) } },
    });
    return users.map((user) => this.toSummary(user));
  }

  async findOne(id: string, requester: RequestUser) {
    if (requester.roles.includes('SUPER_ADMIN')) {
      const user = await this.userService.findOneWhere({ id });
      return this.toSummary(user);
    }

    const user = await this.userService.findOneWhere({
      id,
      scopes: { some: { OR: await this.buildScopeOrFilter(requester.userId) } },
    });
    return this.toSummary(user);
  }

  // Flattens the userRoles relation into roles: Role[], matching the
  // convention AuthService.getMe's CurrentUserResponse already uses —
  // scopes passes through as-is (raw UserScope[] rows, no joined names;
  // the frontend resolves faculty/department/program names client-side
  // from the org-structure lists it already fetches everywhere else).
  private toSummary(
    user: Prisma.UserGetPayload<{
      omit: { passwordHash: true };
      include: { userRoles: true; scopes: true };
    }>,
  ) {
    const { userRoles, ...rest } = user;
    return { ...rest, roles: userRoles.map((userRole) => userRole.role) };
  }

  async updateActiveStatus(id: string, isActive: boolean, requester: RequestUser) {
    // Reuses the same scope-filtered lookup as findOne — a natural 404 if
    // the target is outside the ADMIN's scope, no special-case branch.
    await this.findOne(id, requester);
    return this.userService.setActiveStatus(id, isActive);
  }

  async resendInvitation(id: string, requester: RequestUser) {
    await this.findOne(id, requester);
    const token = await this.pendingInvitationService.resend(id);
    const user = await this.userService.findById(id);
    console.warn(`[INVITE MOCK] Would send invitation token "${token}" to ${user.email}`);
    return { message: 'Invitation resent' };
  }

  async assignRole(id: string, role: Role, requester: RequestUser) {
    await this.assertRoleActionAllowed(id, role, requester);
    return this.userRoleService.assignRole(id, role);
  }

  async revokeRole(id: string, role: Role, requester: RequestUser) {
    await this.assertRoleActionAllowed(id, role, requester);
    return this.userRoleService.revokeRole(id, role);
  }

  private async assertRoleActionAllowed(
    id: string,
    role: Role,
    requester: RequestUser,
  ) {
    if (role === 'STUDENT') {
      throw new BadRequestException(
        'STUDENT role is not managed through this endpoint',
      );
    }
    // Natural 404 if the target is outside the ADMIN's scope.
    await this.findOne(id, requester);

    if (!requester.roles.includes('SUPER_ADMIN') && role !== 'STAFF') {
      throw new ForbiddenException('ADMIN may only manage the STAFF role');
    }
  }

  // Fetches the requester's own effective scopes (small, bounded — their
  // own data, not "all users") and expands each into the 3-way nested
  // clause needed because UserScope's facultyId/departmentId/programId
  // are XOR'd — a DEPARTMENT-level scope has facultyId:null, so it must
  // also match child Programs via program.departmentId, not just
  // departmentId directly. Genuinely query-level per CONVENTIONS §3a: the
  // DB does the user filtering, this only pre-computes the WHERE clause
  // from the requester's own small scope set.
  private async buildScopeOrFilter(
    requesterId: string,
  ): Promise<Prisma.UserScopeWhereInput[]> {
    const effectiveScopes = await this.scopeResolverService.getEffectiveScopes(
      requesterId,
    );

    // Non-null assertions below are safe by the XOR invariant UserScope is
    // constructed under (UserScopeService.assignScope): a FACULTY-level
    // row always has facultyId set, a DEPARTMENT-level row always has
    // departmentId set, etc. — TS can't infer that from the `level` branch
    // alone since EffectiveScope's fields are independently `string | null`.
    return effectiveScopes.flatMap((scope): Prisma.UserScopeWhereInput[] => {
      if (scope.level === 'FACULTY') {
        return [
          { level: 'FACULTY', facultyId: scope.facultyId! },
          { level: 'DEPARTMENT', department: { facultyId: scope.facultyId! } },
          {
            level: 'PROGRAM',
            program: { department: { facultyId: scope.facultyId! } },
          },
        ];
      }
      if (scope.level === 'DEPARTMENT') {
        return [
          { level: 'DEPARTMENT', departmentId: scope.departmentId! },
          { level: 'PROGRAM', program: { departmentId: scope.departmentId! } },
        ];
      }
      return [{ level: 'PROGRAM', programId: scope.programId! }];
    });
  }
}
