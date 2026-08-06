import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaClientOrTx } from '../../prisma/prisma.types';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h — shorter than invitation's
// 48h, since this is a live "I forgot my password right now" flow rather
// than an async admin-provisioning one.

// Same token-hash+TTL shape as PendingInvitationService, for an existing
// User that already has a password rather than one that never had one.
@Injectable()
export class PasswordResetService {
  constructor(private readonly prisma: PrismaService) {}

  // Delete-then-recreate in one transaction, so repeat forgot-password
  // requests don't accumulate stale rows — mirrors
  // PendingInvitationService.resend.
  async create(userId: string): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      const token = randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(token);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await tx.passwordResetToken.create({
        data: { tokenHash, userId, expiresAt },
      });
      return token;
    });
  }

  async findValidByToken(token: string, tx: PrismaClientOrTx = this.prisma) {
    const pending = await tx.passwordResetToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });

    if (!pending || pending.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Reset link expired or invalid — request a new one',
      );
    }

    return pending;
  }

  async consume(id: string, tx: PrismaClientOrTx = this.prisma) {
    return tx.passwordResetToken.delete({ where: { id } });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
