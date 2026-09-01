import {
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
  Body,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SkipPasswordChangeCheck } from '../../common/decorators/skip-password-change-check.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';
import { Jwt2faPendingGuard } from '../../common/guards/jwt-2fa-pending.guard';
import { AuthService } from './auth.service';
import { TwoFactorService } from './two-factor.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CompleteGoogleRegistrationDto } from './dto/complete-google-registration.dto';
import { TwoFactorEnableDto } from './dto/two-factor-enable.dto';
import { TwoFactorDisableDto } from './dto/two-factor-disable.dto';
import { TwoFactorVerifyDto } from './dto/two-factor-verify.dto';
import { GoogleProfile } from './google-profile.interface';
import { RequestUser } from './request-user.interface';

const REFRESH_COOKIE_NAME = 'refreshToken';
// Keep in sync with JWT_REFRESH_EXPIRES_IN's default (7d) — the cookie's
// own expiry is just a client-side hint anyway, the JWT's own `exp` claim
// is what JwtRefreshStrategy actually enforces.
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Register a new student account — sets the refresh token as an httpOnly cookie and returns the access token in the body',
  })
  @ApiResponse({ status: 201, description: 'Access token issued, refresh cookie set' })
  @ApiResponse({ status: 400, description: 'Invalid or mismatched program/curriculum' })
  @ApiResponse({ status: 409, description: 'Email or student code already in use' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.register(dto);
    this.setRefreshCookie(response, refreshToken);
    return { accessToken };
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Verify email + password. If the account has 2FA enabled, returns a short-lived pendingToken instead of an access token — submit it with a TOTP/recovery code to POST /auth/2fa/verify to finish logging in. Otherwise sets the refresh token as an httpOnly cookie and returns the access token in the body, unchanged from before 2FA existed.',
  })
  @ApiResponse({ status: 201, description: 'Access token issued (refresh cookie set), or a pendingToken if 2FA is required' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto);
    if ('requiresTwoFactor' in result) {
      return result;
    }
    this.setRefreshCookie(response, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({
    summary:
      'Exchange the httpOnly refresh cookie for a new access token — the refresh token itself is not rotated',
  })
  @ApiResponse({ status: 201, description: 'New access token issued' })
  @ApiResponse({ status: 401, description: 'Refresh cookie missing, invalid, or expired' })
  refresh(@CurrentUser() user: RequestUser) {
    return this.authService.refreshAccessToken(user.userId);
  }

  @Post('accept-invitation')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Set a password for a user created via User Management (Module 12), consuming the invitation token',
  })
  @ApiResponse({ status: 201, description: 'Password set — log in normally next' })
  @ApiResponse({ status: 401, description: 'Invitation expired or invalid' })
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.authService.acceptInvitation(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @SkipPasswordChangeCheck()
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Logout — clears the refresh cookie. The access token itself is stateless and short-lived (never persisted client-side beyond memory), so there is nothing else to revoke.',
  })
  @ApiResponse({ status: 201, description: 'Logged out, refresh cookie cleared' })
  logout(@Res({ passthrough: true }) response: Response) {
    this.clearRefreshCookie(response);
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @SkipPasswordChangeCheck()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user' })
  getMe(@CurrentUser() user: RequestUser) {
    return this.authService.getMe(user.userId);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @SkipPasswordChangeCheck()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change the current user’s password' })
  @ApiResponse({ status: 200, description: 'Password changed' })
  @ApiResponse({ status: 401, description: 'Current password incorrect, or no password set on this account' })
  changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: RequestUser) {
    return this.authService.changePassword(user.userId, dto);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Request a password reset link — always returns the same response whether or not the email exists (prevents account enumeration)',
  })
  @ApiResponse({ status: 201, description: 'If an account exists, a reset link has been sent' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Set a new password using a forgot-password reset token' })
  @ApiResponse({ status: 201, description: 'Password reset — log in normally next' })
  @ApiResponse({ status: 401, description: 'Reset link expired or invalid' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @SkipPasswordChangeCheck()
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Generate a new TOTP secret + QR code (not yet active) — call POST /auth/2fa/enable with a code from the scanned app to actually turn 2FA on. Safe to call repeatedly; each call overwrites the previous unconfirmed secret.',
  })
  @ApiResponse({ status: 201, description: 'QR code (data URL) + secret for manual entry' })
  twoFactorSetup(@CurrentUser() user: RequestUser) {
    return this.twoFactorService.setup(user.userId, user.email);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @SkipPasswordChangeCheck()
  @ApiBearerAuth('access-token')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Confirm a 6-digit code from the authenticator app to actually turn 2FA on — proves the app was set up correctly before it can lock the account. Returns 8 recovery codes, shown exactly once.',
  })
  @ApiResponse({ status: 201, description: '2FA enabled; recovery codes (plaintext, one-time)' })
  @ApiResponse({ status: 400, description: 'No pending setup — call POST /auth/2fa/setup first' })
  @ApiResponse({ status: 401, description: 'Invalid verification code' })
  twoFactorEnable(@Body() dto: TwoFactorEnableDto, @CurrentUser() user: RequestUser) {
    return this.twoFactorService.enable(user.userId, dto.code);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @SkipPasswordChangeCheck()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Turn 2FA off — requires the current password to confirm' })
  @ApiResponse({ status: 201, description: '2FA disabled' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async twoFactorDisable(@Body() dto: TwoFactorDisableDto, @CurrentUser() user: RequestUser) {
    await this.twoFactorService.disable(user.userId, dto.password);
    return { message: '2FA disabled' };
  }

  @Post('2fa/verify')
  @UseGuards(Jwt2faPendingGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Second step of login for an account with 2FA enabled — submit the pendingToken from POST /auth/login (as the Authorization bearer) plus a TOTP or recovery code. Issues the same access token + refresh cookie a normal login would.',
  })
  @ApiResponse({ status: 201, description: 'Access token issued, refresh cookie set' })
  @ApiResponse({ status: 401, description: 'pendingToken expired/invalid, or the code is wrong' })
  async twoFactorVerify(
    @Body() dto: TwoFactorVerifyDto,
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const isValid = await this.twoFactorService.verifyLoginCode(user.userId, dto.code);
    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }
    const { accessToken, refreshToken } = await this.authService.completeTwoFactorLogin(
      user.userId,
    );
    this.setRefreshCookie(response, refreshToken);
    return { accessToken };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Start Google OAuth sign-in (redirects to Google)' })
  googleAuth() {
    // Body intentionally empty — AuthGuard('google') intercepts the
    // request and performs the redirect to Google's consent screen.
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary:
      'Google OAuth callback — a top-level browser redirect target, not a fetch call, so it can\'t return JSON. Sets the refresh cookie (returning user) then redirects into the frontend.',
  })
  async googleAuthCallback(
    @CurrentUser() profile: GoogleProfile,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.handleGoogleCallback(profile);
    const frontendUrl = this.configService.get<string>('frontendUrl');

    if ('isNewUser' in result) {
      response.redirect(
        `${frontendUrl}/register/google?pendingToken=${encodeURIComponent(result.pendingToken)}`,
      );
      return;
    }

    if ('requiresTwoFactor' in result) {
      // Top-level redirect target (see this route's own doc comment) —
      // can't return JSON, so the pending token travels as a query
      // param. The login page reads it on mount and jumps straight to
      // the code-entry step instead of the email/password form.
      response.redirect(
        `${frontendUrl}/login?pendingToken=${encodeURIComponent(result.pendingToken)}&requires2fa=1`,
      );
      return;
    }

    this.setRefreshCookie(response, result.refreshToken);
    response.redirect(frontendUrl!);
  }

  @Post('google/complete-registration')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Finish Google sign-up by supplying the remaining student fields — sets the refresh token as an httpOnly cookie and returns the access token in the body',
  })
  @ApiResponse({ status: 201, description: 'Access token issued, refresh cookie set' })
  @ApiResponse({ status: 401, description: 'Pending registration session expired or invalid' })
  @ApiResponse({ status: 400, description: 'Invalid or mismatched program/curriculum' })
  @ApiResponse({ status: 409, description: 'Student code already in use' })
  async completeGoogleRegistration(
    @Body() dto: CompleteGoogleRegistrationDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.completeGoogleRegistration(dto);
    this.setRefreshCookie(response, refreshToken);
    return { accessToken };
  }

  private setRefreshCookie(response: Response, refreshToken: string) {
    response.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('nodeEnv') === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    });
  }

  private clearRefreshCookie(response: Response) {
    response.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: this.configService.get<string>('nodeEnv') === 'production',
      sameSite: 'lax',
      path: '/api/auth',
    });
  }
}
