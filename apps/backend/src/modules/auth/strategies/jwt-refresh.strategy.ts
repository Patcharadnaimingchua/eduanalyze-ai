import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { UserService } from '../../users/user/user.service';
import { JwtPayload } from '../jwt-payload.interface';
import { RequestUser } from '../request-user.interface';

// Sibling to JwtStrategy — same "always resolve live" re-fetch, but reads
// the refresh token from the httpOnly cookie (never a header, never
// touched by frontend JS) and verifies against JWT_REFRESH_SECRET instead
// of the access secret. Named explicitly so it doesn't collide with
// JwtStrategy's implicit 'jwt' registration.
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: (req: Request) => req?.cookies?.refreshToken ?? null,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
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
    return { userId: payload.sub, email: payload.email, roles: payload.roles };
  }
}
