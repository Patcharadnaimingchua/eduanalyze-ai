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
import { PasswordResetService } from '../../auth/password-reset.service';
import { EmailService } from '../../../common/email/email.service';
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
    private readonly passwordResetService: PasswordResetService,
    private readonly emailService: EmailService,
  ) {}

  async createStaffOrAdmin(dto: CreateUserDto, requester: RequestUser) {
    // STUDENT is /auth/register-only — never a second code path that can
    // create a student account (CONVENTIONS.md §6).
    if (dto.role === 'STUDENT') {
      throw new BadRequestException(
        'STUDENT accounts must be created via /auth/register',
      );
    }

    // Advisor feedback (see plan file, "เรื่องที่ 2"): SUPER_ADMIN must
    // never be grantable through this API, even by an existing
    // SUPER_ADMIN — provisioning a new one is a deliberately out-of-band
    // action (direct database write), not something reachable from any
    // UI/API surface. Checked before the requester-role branch below so
    // it applies unconditionally.
    if (dto.role === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'SUPER_ADMIN accounts cannot be created via API — provision directly via database',
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

    // Real email service now exists (EmailService) — the account gets an
    // unusable, never-revealed password hash instead of a temp password
    // the requester would have to copy and hand over out-of-band. The new
    // user sets their own real password via the same reset-token/email
    // flow POST /auth/forgot-password already uses (see below).
    // generateTempPassword() is reused purely as an entropy source here —
    // its output never leaves this function.
    const unusablePassword = generateTempPassword();
    const passwordHash = await hashPassword(unusablePassword);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await this.userService.create(
        dto.email,
        passwordHash,
        dto.fullName,
        tx,
        true, // mustChangePassword — the generated hash is unusable anyway; kept true for defense in depth
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

    // Outside the transaction — token creation/email sending are not part
    // of the "did the account get created" guarantee. Best-effort: if
    // SMTP is down, the account still exists and the new user (or the
    // requester on their behalf) can always retry via the ordinary
    // POST /auth/forgot-password self-service flow, same mechanism.
    let passwordSetupEmailSent = true;
    try {
      const token = await this.passwordResetService.create(user.id);
      await this.emailService.sendPasswordSetupEmail(user.email, token, 'new-account');
    } catch {
      passwordSetupEmailSent = false;
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      passwordSetupEmailSent,
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

  // Narrow, STAFF-reachable alternative to GET /users (which stays
  // ADMIN/SUPER_ADMIN-only) — STAFF needs *some* way to find an
  // INSTRUCTOR's userId to assign them to a CourseInstructor, but must not
  // browse the full user list or see role/scope details of other accounts.
  //
  // Not scope-filtered by UserScope, unlike listUsers: INSTRUCTOR access is
  // modeled per-course via CourseInstructor, not via org-hierarchy
  // UserScope like ADMIN/STAFF — an instructor usually has no UserScope
  // row at all, so filtering on it would incorrectly return empty for
  // every non-SUPER_ADMIN caller. The actual scope check for who STAFF can
  // assign to which course still happens where it matters: ScopeGuard on
  // POST /course-instructors's `courseId`.
  async listInstructors() {
    const users = await this.userService.findAll({
      userRoles: { some: { role: 'INSTRUCTOR' } },
    });
    return users.map((user) => this.toInstructorListItem(user));
  }

  private toInstructorListItem(user: { id: string; fullName: string; email: string }) {
    return { id: user.id, fullName: user.fullName, email: user.email };
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
    // Same unconditional block as createStaffOrAdmin — SUPER_ADMIN is
    // never grantable (or revocable) through this API, regardless of the
    // requester's own role.
    if (role === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'SUPER_ADMIN role cannot be managed via API — provision directly via database',
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
