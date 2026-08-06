import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { GooglePendingRegistrationService } from './google-pending-registration.service';
import { PendingInvitationModule } from './pending-invitation.module';
import { PasswordResetModule } from './password-reset.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  // No default secret/expiry on JwtModule — access and refresh tokens use
  // two different secrets, passed explicitly on each jwtService.sign()
  // call in AuthService instead of a single module-wide default.
  // JwtStrategy verifies incoming access tokens; it reads
  // JWT_ACCESS_SECRET directly (see strategies/jwt.strategy.ts).
  // GoogleStrategy reads GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL directly for
  // the same reason.
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({}),
    PendingInvitationModule,
    PasswordResetModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    GooglePendingRegistrationService,
    JwtStrategy,
    GoogleStrategy,
  ],
})
export class AuthModule {}
