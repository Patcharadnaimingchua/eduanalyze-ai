import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../users/user/user.service';
import { UserRoleService } from '../../users/user-role/user-role.service';
import { TwoFactorPendingPayload } from '../two-factor-pending-payload.interface';
import { RequestUser } from '../request-user.interface';

// Third sibling to JwtStrategy/JwtRefreshStrategy — verifies the
// short-lived "pending 2FA" token AuthService.login()/
// handleGoogleCallback() issues once password/Google auth succeeded but
// TOTP has not been checked yet. Own strategy name + own secret
// (JWT_2FA_PENDING_SECRET) so this token can never be replayed as a real
// access or refresh token, or vice versa. Read from the ordinary
// Authorization: Bearer header (not a cookie) — it's one-shot and
// short-lived (5m default), not a persistent session artifact.
@Injectable()
export class Jwt2faPendingStrategy extends PassportStrategy(
  Strategy,
  'jwt-2fa-pending',
) {
  constructor(
    private readonly userService: UserService,
    private readonly userRoleService: UserRoleService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_2FA_PENDING_SECRET,
    });
  }

  async validate(payload: TwoFactorPendingPayload): Promise<RequestUser> {
    let user;
    try {
      user = await this.userService.findById(payload.sub);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('Account no longer exists');
      }
      throw error;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // The pending payload only carries `sub` — roles/mustChangePassword
    // are resolved live here, same as the access/refresh strategies do.
    const roles = await this.userRoleService.findRolesByUserId(user.id);
    return {
      userId: user.id,
      email: user.email,
      roles,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
