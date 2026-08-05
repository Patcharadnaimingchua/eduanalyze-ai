import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  SCOPE_TARGET_KEY,
  ScopeTargetEntity,
  ScopeTargetSource,
} from '../decorators/scope-target.decorator';
import { RequestUser } from '../../modules/auth/request-user.interface';
import { ScopeResolverService } from '../scope/scope-resolver.service';

interface ScopeTargetMetadata {
  entity: ScopeTargetEntity;
  source: ScopeTargetSource;
}

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly scopeResolverService: ScopeResolverService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<ScopeTargetMetadata>(
      SCOPE_TARGET_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!metadata) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: RequestUser; params: Record<string, string>; body: Record<string, unknown> }>();
    const user = request.user;

    // SUPER_ADMIN is unscoped by design — same bypass every endpoint
    // already relies on today, kept as a zero-query fast path.
    if (user?.roles?.includes('SUPER_ADMIN')) {
      return true;
    }

    const { entity, source } = metadata;
    const targetId =
      source.from === 'param'
        ? request.params[source.key]
        : (request.body[source.key] as string | undefined);

    const target = await this.scopeResolverService.resolveAncestry(
      entity,
      targetId as string,
    );

    const effectiveScopes = await this.scopeResolverService.getEffectiveScopes(
      user!.userId,
    );

    const covered = this.scopeResolverService.isCovered(target, effectiveScopes);

    if (!covered) {
      // 403, not 404 — unlike STUDENT self-owned data (CONVENTIONS §3a),
      // organization structure isn't personal data whose existence needs
      // hiding; the honest response is "exists, but outside your scope."
      throw new ForbiddenException(
        `You do not have scope covering this ${entity}`,
      );
    }

    return true;
  }
}
