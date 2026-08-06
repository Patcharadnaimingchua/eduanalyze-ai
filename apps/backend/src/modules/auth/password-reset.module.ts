import { Module } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';

// Leaf module (only depends on PrismaService, which is @Global()) — same
// shape as PendingInvitationModule.
@Module({
  providers: [PasswordResetService],
  exports: [PasswordResetService],
})
export class PasswordResetModule {}
