import { Module } from '@nestjs/common';
import { PendingInvitationService } from './pending-invitation.service';

// Leaf module (only depends on PrismaService, which is @Global()) — has
// two independent consumers from day one (AuthModule for acceptance,
// UserManagementModule for creation/resend), so it's split out the same
// way ScopeModule was, rather than folded into AuthModule and forcing
// UserManagementModule to depend on all of AuthModule's JWT/OAuth
// machinery just to create an invitation row.
@Module({
  providers: [PendingInvitationService],
  exports: [PendingInvitationService],
})
export class PendingInvitationModule {}
