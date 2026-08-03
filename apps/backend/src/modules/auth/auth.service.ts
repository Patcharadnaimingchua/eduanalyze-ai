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
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../users/user/user.service';
import { UserRoleService } from '../users/user-role/user-role.service';
import { UserAuthMethodService } from '../users/user-auth-method/user-auth-method.service';
import { StudentProfileService } from '../users/student-profile/student-profile.service';
import { OtpService } from './otp.service';
import { GooglePendingRegistrationService } from './google-pending-registration.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CompleteGoogleRegistrationDto } from './dto/complete-google-registration.dto';
import { JwtPayload } from './jwt-payload.interface';
import { GoogleProfile } from './google-profile.interface';

const PASSWORD_SALT_ROUNDS = 10;
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
    private readonly otpService: OtpService,
    private readonly googlePendingRegistrationService: GooglePendingRegistrationService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);

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

    // OTP creation/delivery happens outside the transaction: if it fails,
    // the account still exists and the user can request the OTP again —
    // it should not roll back the whole registration.
    await this.otpService.createAndSend(user.id, user.email);

    return { userId: user.id, email: user.email };
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

    // Google already verified this identity — no OTP step, per Phase 3
    // design (an extra in-app OTP on top of Google's own auth would add
    // friction without adding real security).
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

    await this.otpService.createAndSend(user.id, user.email);

    return { userId: user.id, email: user.email };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.userService.findByEmail(dto.email);
    await this.otpService.verify(user.id, dto.code);
    return this.issueTokenPair(user);
  }

  private async issueTokenPair(user: User) {
    const roles = await this.userRoleService.findRolesByUserId(user.id);
    const payload: JwtPayload = { sub: user.id, email: user.email, roles };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    return { accessToken, refreshToken };
  }
}
