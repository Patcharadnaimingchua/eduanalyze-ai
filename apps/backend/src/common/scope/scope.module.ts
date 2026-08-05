import { Module } from '@nestjs/common';
import { ScopeResolverService } from './scope-resolver.service';
import { ScopeGuard } from '../guards/scope.guard';

// Leaf module — no imports. Depends only on PrismaService, which is
// @Global(), so this can be imported into DepartmentModule/ProgramModule
// without creating a cycle back through UserScopeModule (which already
// imports both of those for its own validation needs).
@Module({
  providers: [ScopeResolverService, ScopeGuard],
  exports: [ScopeResolverService, ScopeGuard],
})
export class ScopeModule {}
