import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthProvider, Prisma, Role, User } from '@prisma/client';
import { hashPassword } from '../../common/util/password.util';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../users/user/user.service';
import { UserRoleService } from '../users/user-role/user-role.service';
import { UserAuthMethodService } from '../users/user-auth-method/user-auth-method.service';
import { StudentProfileService } from '../users/student-profile/student-profile.service';
import { GooglePendingRegistrationService } from './google-pending-registration.service';
import { PendingInvitationService } from './pending-invitation.service';
import { PasswordResetService } from './password-reset.service';
import { EmailService } from '../../common/email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CompleteGoogleRegistrationDto } from './dto/complete-google-registration.dto';
import { JwtPayload } from './jwt-payload.interface';
import { GoogleProfile } from './google-profile.interface';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

interface CreateStudentAccountParams {
  email: string;
  passwordHash: string | null;
  fullName: string;
  provider: AuthProvider;
  providerUserId: string | null;
  studentCode: string;
  programId: string;
  curriculumId: string;
  admissionYear: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly userRoleService: UserRoleService,
    private readonly userAuthMethodService: UserAuthMethodService,
    private readonly studentProfileService: StudentProfileService,
    private readonly googlePendingRegistrationService: GooglePendingRegistrationService,
    private readonly pendingInvitationService: PendingInvitationService,
    private readonly passwordResetService: PasswordResetService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await hashPassword(dto.password);

    const user = await this.createStudentAccount({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      provider: AuthProvider.PASSWORD,
      providerUserId: null,
      studentCode: dto.studentCode,
      programId: dto.programId,
      curriculumId: dto.curriculumId,
      admissionYear: dto.admissionYear,
    });

    return this.issueTokenPair(user);
  }

  async handleGoogleCallback(profile: GoogleProfile) {
    const existingMethod =
      await this.userAuthMethodService.findByProviderAndProviderUserId(
        AuthProvider.GOOGLE,
        profile.googleId,
      );

    if (existingMethod) {
      const user = await this.userService.findById(existingMethod.userId);
      return this.issueTokenPair(user);
    }

    // No Google identity linked yet — check if an account already exists
    // under this email via a different method. If so, refuse: linking is
    // out of scope for this phase, and silently merging accounts here
    // would be an account-takeover vector.
    let existingUser: User | null = null;
    try {
      existingUser = await this.userService.findByEmail(profile.email);
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }
    if (existingUser) {
      throw new ConflictException(
        'An account already exists with this email using a different sign-in method',
      );
    }

    // Brand-new identity: cannot create the User yet (no studentCode/
    // program/curriculum/admissionYear from Google) — park it as a
    // pending registration and let the client collect the rest.
    const pendingToken = await this.googlePendingRegistrationService.create(
      profile.email,
      profile.googleId,
      profile.fullName,
    );
    return { pendingToken, isNewUser: true };
  }

  async completeGoogleRegistration(dto: CompleteGoogleRegistrationDto) {
    const pending = await this.googlePendingRegistrationService.findValidByToken(
      dto.pendingToken,
    );

    const user = await this.createStudentAccount(
      {
        email: pending.email,
        passwordHash: null,
        fullName: pending.fullName,
        provider: AuthProvider.GOOGLE,
        providerUserId: pending.googleId,
        studentCode: dto.studentCode,
        programId: dto.programId,
        curriculumId: dto.curriculumId,
        admissionYear: dto.admissionYear,
      },
      (tx) => tx.googlePendingRegistration.delete({ where: { id: pending.id } }),
    );

    // Google already verified this identity — issue tokens immediately,
    // same as register()/login().
    return this.issueTokenPair(user);
  }

  // Shared by register() (PASSWORD) and completeGoogleRegistration()
  // (GOOGLE) — the one place that creates User+UserAuthMethod+UserRole+
  // StudentProfile atomically, per the "single transaction" rule. Accepts
  // an optional extra step run inside the same transaction (used to
  // consume/delete the pending-registration row exactly once).
  private async createStudentAccount(
    params: CreateStudentAccountParams,
    extraTxStep?: (tx: Prisma.TransactionClient) => Promise<unknown>,
  ): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      const createdUser = await this.userService.create(
        params.email,
        params.passwordHash,
        params.fullName,
        tx,
      );

      await this.userAuthMethodService.create(
        createdUser.id,
        params.provider,
        params.providerUserId,
        tx,
      );

      // Role is always STUDENT on self-registration — the client can never
      // choose its own role. Any other role is assigned separately by an
      // admin flow (Phase 13/14), not here.
      await this.userRoleService.assignRole(createdUser.id, Role.STUDENT, tx);

      await this.studentProfileService.create(
        createdUser.id,
        params.studentCode,
        params.programId,
        params.curriculumId,
        params.admissionYear,
        tx,
      );

      if (extraTxStep) {
        await extraTxStep(tx);
      }

      return createdUser;
    });
  }

  async login(dto: LoginDto) {
    // Same generic message for "no such email" and "wrong password" —
    // a distinct 404-style message here would let a client enumerate
    // which emails are registered.
    let user: User;
    try {
      user = await this.userService.findByEmail(dto.email);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
      }
      throw error;
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return this.issueTokenPair(user);
  }

  // Sets the password for a User created via Module 12 (User Management)
  // — that flow creates User/UserRole/UserScope immediately with
  // passwordHash:null, gated behind this invitation token. No auto-login
  // afterward — same as every other auth entry point, the new user goes
  // through normal /auth/login next, not a shortcut.
  async acceptInvitation(dto: AcceptInvitationDto) {
    const pending = await this.pendingInvitationService.findValidByToken(
      dto.token,
    );
    const passwordHash = await hashPassword(dto.password);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: pending.userId },
        data: { passwordHash },
      });
      await this.pendingInvitationService.consume(pending.id, tx);
    });
  }

  async getMe(userId: string) {
    const user = await this.userService.findById(userId);
    const roles = await this.userRoleService.findRolesByUserId(userId);
    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
      mustChangePassword: user.mustChangePassword,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userService.findById(userId);

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'No password set on this account — sign in with Google, or accept your invitation first',
      );
    }

    const oldPasswordMatches = await bcrypt.compare(
      dto.oldPassword,
      user.passwordHash,
    );
    if (!oldPasswordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await hashPassword(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });
  }

  // Always the same response whether or not the email exists — a distinct
  // "no such account" message would let a client enumerate registered
  // emails (CONVENTIONS.md §34, same reasoning as login's generic
  // INVALID_CREDENTIALS_MESSAGE).
  async forgotPassword(dto: ForgotPasswordDto) {
    let user: User;
    try {
      user = await this.userService.findByEmail(dto.email);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return { message: 'If an account exists, a reset link has been sent' };
      }
      throw error;
    }

    if (user.passwordHash) {
      const token = await this.passwordResetService.create(user.id);
      // Swallow send failures here too — letting one propagate would turn
      // "SMTP is down" into a 500 only when the account exists (silence on
      // a not-found email never reaches this branch at all), which is
      // itself an account-enumeration side channel via response shape.
      // EmailService.sendMail already logs the failure.
      await this.emailService
        .sendPasswordSetupEmail(user.email, token, 'reset')
        .catch(() => undefined);
    }
    // A Google-only account (passwordHash: null) gets no token — there's
    // no password to reset. Same generic response either way, so this
    // doesn't leak which case applied.

    return { message: 'If an account exists, a reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const pending = await this.passwordResetService.findValidByToken(dto.token);
    const passwordHash = await hashPassword(dto.newPassword);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: pending.userId },
        data: { passwordHash },
      });
      await this.passwordResetService.consume(pending.id, tx);
    });
  }

  private async buildJwtPayload(user: User): Promise<JwtPayload> {
    const roles = await this.userRoleService.findRolesByUserId(user.id);
    return { sub: user.id, email: user.email, roles };
  }

  private signAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
    });
  }

  private async issueTokenPair(user: User) {
    const payload = await this.buildJwtPayload(user);

    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    return { accessToken, refreshToken };
  }

  // Backs POST /auth/refresh — reissues only a new access token. The
  // refresh token itself is never rotated: there's no server-side
  // revocation table for it to matter against (see the fully-stateless
  // note on logout()), so rotation without a blacklist buys nothing.
  async refreshAccessToken(userId: string): Promise<{ accessToken: string }> {
    const user = await this.userService.findById(userId);
    const payload = await this.buildJwtPayload(user);
    return { accessToken: this.signAccessToken(payload) };
  }
}
