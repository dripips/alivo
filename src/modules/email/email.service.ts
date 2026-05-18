import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private from: string;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.from = this.config.get<string>('RESEND_FROM', 'Alivo <noreply@alivo.cc>');

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend email client initialized');
    } else {
      this.logger.warn('RESEND_API_KEY not set — emails will be logged but not sent');
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.resend) {
      this.logger.log(`[DRY] Email to=${to} subject="${subject}"`);
      return false;
    }

    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });
      this.logger.log(`Email sent to ${to}: "${subject}"`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      return false;
    }
  }

  async sendCheckInAlert(
    guardianEmail: string,
    wardName: string,
    minutesMissed: number,
  ): Promise<boolean> {
    const subject = `Alivo: ${wardName} has not responded`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #d97706; margin-bottom: 16px;">Check-in alert</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">
          <strong>${wardName}</strong> has not responded to a check-in for <strong>${minutesMissed} minutes</strong>.
        </p>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
          Please check in on them or contact them directly. If you believe this is an emergency, call local emergency services.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Alivo Safety Companion</p>
      </div>
    `;
    return this.sendEmail(guardianEmail, subject, html);
  }

  async sendSosAlert(
    guardianEmail: string,
    wardName: string,
    location?: { latitude: number; longitude: number },
  ): Promise<boolean> {
    const subject = `URGENT: SOS from ${wardName}`;
    const locationBlock = location
      ? `<p style="color: #374151; font-size: 14px;">Location: <a href="https://maps.google.com/?q=${location.latitude},${location.longitude}" style="color: #2563eb;">${location.latitude}, ${location.longitude}</a></p>`
      : '';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #dc2626; margin-bottom: 16px;">SOS Alert</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">
          <strong>${wardName}</strong> has triggered an SOS alert and may need immediate assistance.
        </p>
        ${locationBlock}
        <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
          Please try to contact them immediately. If you cannot reach them, consider calling emergency services.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Alivo Safety Companion</p>
      </div>
    `;
    return this.sendEmail(guardianEmail, subject, html);
  }

  async sendFraudAlert(
    guardianEmail: string,
    wardName: string,
    triggerText: string,
  ): Promise<boolean> {
    const subject = `Alivo: Potential fraud detected for ${wardName}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #dc2626; margin-bottom: 16px;">Fraud Detection Alert</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">
          A potentially fraudulent interaction was detected involving <strong>${wardName}</strong>.
        </p>
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <p style="color: #374151; font-size: 14px; margin: 0;">${triggerText}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
          Please speak with ${wardName} about this interaction and verify whether any financial actions were taken.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Alivo Safety Companion</p>
      </div>
    `;
    return this.sendEmail(guardianEmail, subject, html);
  }

  async sendMedicationMissed(
    guardianEmail: string,
    wardName: string,
    medications: string[],
  ): Promise<boolean> {
    const subject = `Alivo: ${wardName} missed medication`;
    const medList = medications.map((m) => `<li>${m}</li>`).join('');
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #d97706; margin-bottom: 16px;">Missed Medication</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">
          <strong>${wardName}</strong> has missed the following medication(s):
        </p>
        <ul style="color: #374151; font-size: 14px; line-height: 1.8;">
          ${medList}
        </ul>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
          Please remind them to take their medication or check if they need assistance.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Alivo Safety Companion</p>
      </div>
    `;
    return this.sendEmail(guardianEmail, subject, html);
  }

  async sendPasswordReset(
    email: string,
    token: string,
    locale: string = 'en',
  ): Promise<boolean> {
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    const isRu = locale === 'ru';
    const subject = isRu ? 'Alivo: Сброс пароля' : 'Alivo: Password Reset';
    const html = isRu
      ? `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #374151; margin-bottom: 16px;">Сброс пароля</h2>
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Вы запросили сброс пароля. Нажмите на кнопку ниже, чтобы создать новый пароль.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 16px;">
              Сбросить пароль
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
            Ссылка действительна в течение 1 часа. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">Alivo Safety Companion</p>
        </div>
      `
      : `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #374151; margin-bottom: 16px;">Password Reset</h2>
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            You requested a password reset. Click the button below to create a new password.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
            This link is valid for 1 hour. If you did not request a password reset, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">Alivo Safety Companion</p>
        </div>
      `;
    return this.sendEmail(email, subject, html);
  }
}
