import { Controller, Get, Post, UseGuards, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CompleteGoogleRegistrationDto } from './dto/complete-google-registration.dto';
import { GoogleProfile } from './google-profile.interface';

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
