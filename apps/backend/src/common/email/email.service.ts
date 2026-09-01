import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendMailParams {
  to: string;
  subject: string;
  html: string;
}

// Single real email-sending point for the whole app (forgot-password,
// account-creation "set your password" email — see auth.service.ts and
// user-management.service.ts). Replaces the console.warn mocks that used
// to stand in for this (search history: "[PASSWORD RESET MOCK]",
// "[INVITE MOCK]") — TODO.md tracked this as a known gap before real SMTP
// credentials were available.
//
// Nodemailer + Gmail SMTP (free tier, App Password required — a normal
// Gmail account password will NOT work since Google blocks plain SMTP
// auth on the real password). Kept swappable: nothing outside this file
// knows it's Gmail specifically, only SMTP_HOST/PORT/USER/PASS/FROM.
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('smtp.host');
    const port = this.configService.get<number>('smtp.port');
    const user = this.configService.get<string>('smtp.user')?.trim();
    // Gmail displays App Passwords grouped as "xxxx xxxx xxxx xxxx" for
    // readability — those spaces are not part of the actual secret and
    // some SMTP auth paths choke on them if pasted verbatim into .env, so
    // strip all whitespace here rather than relying on every operator to
    // remember to remove it before pasting.
    const pass = this.configService.get<string>('smtp.pass')?.replace(/\s+/g, '');
    this.from = this.configService.get<string>('smtp.from')?.trim() || user || '';
    this.frontendUrl = this.configService.get<string>('frontendUrl') || 'http://localhost:3000';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 587 (default, Gmail) uses STARTTLS, not implicit TLS
      auth: user ? { user, pass } : undefined,
    });
  }

  // Best-effort by design — every caller must decide for itself whether a
  // failed send should block the surrounding operation (see
  // UserManagementService.createStaffOrAdmin's comment: account creation
  // still succeeds even if this throws, because the same
  // POST /auth/forgot-password path remains a fallback for the user).
  async sendMail(params: SendMailParams): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${params.to}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  // Both PasswordResetToken use sites (AuthService.forgotPassword's
  // self-service flow, and UserManagementService.createStaffOrAdmin's
  // auto-sent "set your first password" flow) land on the same
  // /reset-password page — only the subject/copy differs based on which
  // triggered it, so the token/link plumbing lives here once.
  async sendPasswordSetupEmail(
    to: string,
    token: string,
    mode: 'reset' | 'new-account',
  ): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
    const subject =
      mode === 'new-account' ? 'ตั้งรหัสผ่านบัญชี EduAnalyzeAI ของคุณ' : 'รีเซ็ตรหัสผ่าน EduAnalyzeAI';
    const intro =
      mode === 'new-account'
        ? 'บัญชีของคุณถูกสร้างขึ้นในระบบ EduAnalyzeAI แล้ว กรุณาตั้งรหัสผ่านเพื่อเริ่มใช้งาน'
        : 'มีคำขอรีเซ็ตรหัสผ่านสำหรับบัญชี EduAnalyzeAI ของคุณ';
    const html = `
      <p>${intro}</p>
      <p><a href="${resetUrl}">${mode === 'new-account' ? 'ตั้งรหัสผ่าน' : 'รีเซ็ตรหัสผ่าน'}</a></p>
      <p>ลิงก์นี้ใช้ได้ครั้งเดียวและหมดอายุใน 1 ชั่วโมง หากคุณไม่ได้ร้องขอ กรุณาเพิกเฉยต่ออีเมลนี้</p>
    `;
    await this.sendMail({ to, subject, html });
  }
}
