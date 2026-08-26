import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../users/user/user.service';
import { JwtPayload } from '../jwt-payload.interface';
import { RequestUser } from '../request-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Read directly from process.env — ConfigService can't be used here
      // since it isn't available until after super() runs (same reason
      // main.ts reads process.env.PORT directly rather than via
      // ConfigService).
      secretOrKey: process.env.JWT_ACCESS_SECRET,
    });
  }

  // Queries the DB on every request rather than trusting the token's
  // claims statelessly — per CONVENTIONS.md §8's "always resolve live"
  // principle, so a deactivated account is rejected on its very next
  // request instead of staying valid until the access token naturally
  // expires (up to 15 minutes later).
  async validate(payload: JwtPayload): Promise<RequestUser> {
    let user;
    try {
      user = await this.userService.findById(payload.sub);
    } catch (error) {
      // A token for a user that no longer exists is an auth failure, not
      // a 404 — don't leak UserService's NotFoundException as-is.
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('Account no longer exists');
      }
      throw error;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }
    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
