import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomInt, createHash } from 'crypto';
import { OtpPurpose } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService) {}

  async createAndSend(userId: string, email: string) {
    const code = this.generateCode();
    const codeHash = this.hashCode(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await this.prisma.otpCode.create({
      data: {
        userId,
        codeHash,
        purpose: OtpPurpose.LOGIN,
        expiresAt,
      },
    });

    // Placeholder: no SMTP provider is wired up yet. Delivery is mocked by
    // logging the code to the console in dev so the login flow is testable
    // end-to-end. Replace this call with a real email send once an SMTP
    // provider is chosen — that is a separate task, not part of Phase 3.
    this.mockSend(email, code);
  }

  async verify(userId: string, code: string): Promise<void> {
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        userId,
        purpose: OtpPurpose.LOGIN,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new UnauthorizedException(
        'No valid OTP found — request a new one',
      );
    }

    if (otp.codeHash !== this.hashCode(code)) {
      const attemptCount = otp.attemptCount + 1;
      const lockedOut = attemptCount >= MAX_ATTEMPTS;
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attemptCount, isUsed: lockedOut },
      });
      throw new UnauthorizedException(
        lockedOut
          ? 'Too many incorrect attempts — request a new OTP'
          : 'Incorrect OTP code',
      );
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });
  }

  private generateCode(): string {
    return randomInt(0, 10 ** OTP_LENGTH)
      .toString()
      .padStart(OTP_LENGTH, '0');
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private mockSend(email: string, code: string) {
    console.warn(`[OTP MOCK] Would send OTP "${code}" to ${email}`);
  }
}
