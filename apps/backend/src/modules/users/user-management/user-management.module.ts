import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { UserRoleModule } from '../user-role/user-role.module';
import { UserScopeModule } from '../user-scope/user-scope.module';
import { ScopeModule } from '../../../common/scope/scope.module';
import { PendingInvitationModule } from '../../auth/pending-invitation.module';
import { PasswordResetModule } from '../../auth/password-reset.module';
import { EmailModule } from '../../../common/email/email.module';
import { UserManagementController } from './user-management.controller';
import { UserManagementService } from './user-management.service';

@Module({
  imports: [
    UserModule,
    UserRoleModule,
    UserScopeModule,
    ScopeModule,
    PendingInvitationModule,
    PasswordResetModule,
    EmailModule,
  ],
  controllers: [UserManagementController],
  providers: [UserManagementService],
})
export class UserManagementModule {}
