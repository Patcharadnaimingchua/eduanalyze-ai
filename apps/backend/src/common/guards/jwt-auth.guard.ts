import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { RequestUser } from '../../modules/auth/request-user.interface';
import { SKIP_PASSWORD_CHANGE_CHECK_KEY } from '../decorators/skip-password-change-check.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  // Every protected route goes through this one guard (sometimes alone,
  // sometimes with RolesGuard/ScopeGuard added) — overriding handleRequest
  // here, rather than adding a check in JwtStrategy.validate(), is what
  // lets a handful of routes opt out via @SkipPasswordChangeCheck() (most
  // importantly PATCH /auth/change-password itself — validate() has no
  // access to route metadata, so it can't express that allowlist).
  handleRequest<TUser = RequestUser>(
    err: unknown,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    const validatedUser = super.handleRequest(err, user, info, context) as RequestUser;

    const skipCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_PASSWORD_CHANGE_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!skipCheck && validatedUser.mustChangePassword) {
      throw new ForbiddenException('Password change required before continuing');
    }

    return validatedUser as TUser;
  }
}
