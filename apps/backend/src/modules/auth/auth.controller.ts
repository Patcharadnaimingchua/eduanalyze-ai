import { Controller, Get, Patch, Post, UseGuards, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CompleteGoogleRegistrationDto } from './dto/complete-google-registration.dto';
import { GoogleProfile } from './google-profile.interface';
import { RequestUser } from './request-user.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({
    summary: 'Register a new student account (email + password + OTP)',
  })
  @ApiResponse({
    status: 201,
    description: 'Account created, OTP sent to complete login',
  })
  @ApiResponse({ status: 400, description: 'Invalid or mismatched program/curriculum' })
  @ApiResponse({ status: 409, description: 'Email or student code already in use' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify email + password, send a new login OTP' })
  @ApiResponse({ status: 201, description: 'OTP sent to complete login' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('verify-otp')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify a login OTP and issue an access/refresh token pair' })
  @ApiResponse({ status: 201, description: 'Access and refresh tokens issued' })
  @ApiResponse({ status: 401, description: 'Invalid, expired, or already-used OTP' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
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
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Logout — client-side only. JWT here is fully stateless (no server-side session/refresh-token table), so there is nothing to revoke; this endpoint exists for API symmetry. The client is responsible for discarding its tokens.',
  })
  @ApiResponse({ status: 201, description: 'Logged out (client should discard tokens)' })
  logout() {
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user' })
  getMe(@CurrentUser() user: RequestUser) {
    return this.authService.getMe(user.userId);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
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

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Start Google OAuth sign-in (redirects to Google)' })
  googleAuth() {
    // Body intentionally empty — AuthGuard('google') intercepts the
    // request and performs the redirect to Google's consent screen.
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({
    status: 200,
    description:
      'Either { accessToken, refreshToken } (returning user) or { pendingToken, isNewUser: true } (new user, must call complete-registration)',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already registered via a different sign-in method',
  })
  googleAuthCallback(@CurrentUser() profile: GoogleProfile) {
    return this.authService.handleGoogleCallback(profile);
  }

  @Post('google/complete-registration')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({
    summary: 'Finish Google sign-up by supplying the remaining student fields',
  })
  @ApiResponse({ status: 201, description: 'Access and refresh tokens issued' })
  @ApiResponse({ status: 401, description: 'Pending registration session expired or invalid' })
  @ApiResponse({ status: 400, description: 'Invalid or mismatched program/curriculum' })
  @ApiResponse({ status: 409, description: 'Student code already in use' })
  completeGoogleRegistration(@Body() dto: CompleteGoogleRegistrationDto) {
    return this.authService.completeGoogleRegistration(dto);
  }
}
