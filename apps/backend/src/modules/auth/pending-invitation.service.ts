import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaClientOrTx } from '../../prisma/prisma.types';

const INVITATION_TTL_MS = 48 * 60 * 60 * 1000;

// Gates password-setting for a User created via Module 12 (User
// Management) — same token-hash+TTL shape as GooglePendingRegistration,
// but this one has a real FK to an already-existing User (that flow's
// User doesn't exist yet when its pending row is created; this one
// does — see schema.prisma comment on PendingInvitation).
@Injectable()
export class PendingInvitationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    email: string,
    tx: PrismaClientOrTx = this.prisma,
  ): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

    await tx.pendingInvitation.create({
      data: { tokenHash, userId, email, expiresAt },
    });

    return token;
  }

  async findValidByToken(token: string, tx: PrismaClientOrTx = this.prisma) {
    const pending = await tx.pendingInvitation.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });

    if (!pending || pending.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Invitation expired or invalid — ask an admin to resend it',
      );
    }

    return pending;
  }

  async consume(id: string, tx: PrismaClientOrTx = this.prisma) {
    return tx.pendingInvitation.delete({ where: { id } });
  }

  // Delete-then-recreate in one transaction, so a token that expired
  // before the user accepted isn't a permanent dead end (can't recreate
  // the User — email already taken; can't accept — token expired).
  async resend(userId: string): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }
      if (user.passwordHash) {
        throw new ConflictException(
          'This invitation has already been accepted',
        );
      }

      await tx.pendingInvitation.deleteMany({ where: { userId } });
      return this.create(userId, user.email, tx);
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
