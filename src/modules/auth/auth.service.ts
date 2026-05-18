import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private email: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(dto.email ? [{ email: dto.email }] : []),
          ...(dto.phone ? [{ phone: dto.phone }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException('User already exists');
    }

    const password = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        password,
        locale: dto.locale || 'ru',
        timezone: dto.timezone || 'Europe/Moscow',
        role: (dto.role as any) || 'WARD',
      },
    });

    const token = this.generateAccessToken(user.id, user.role);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
      refreshToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(dto.email ? [{ email: dto.email }] : []),
          ...(dto.phone ? [{ phone: dto.phone }] : []),
        ],
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateAccessToken(user.id, user.role);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
      refreshToken,
    };
  }

  // ── Password Reset ────────────────────────────────────────

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.prisma.passwordReset.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      await this.email.sendPasswordReset(email, token, user.locale);
      this.logger.log(`Password reset requested for ${email}`);
    } else {
      this.logger.log(`Password reset requested for unknown email: ${email}`);
    }

    // Always return the same response to avoid leaking user existence
    return { message: 'If this email is registered, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const reset = await this.prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!reset) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (reset.usedAt) {
      throw new BadRequestException('Reset token has already been used');
    }

    if (reset.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
    ]);

    this.logger.log(`Password reset completed for user ${reset.userId}`);

    return { message: 'Password has been reset successfully.' };
  }

  // ── Refresh Token ─────────────────────────────────────────

  async refreshToken(refreshTokenValue: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Revoke the old refresh token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const newAccessToken = this.generateAccessToken(stored.user.id, stored.user.role);
    const newRefreshToken = await this.createRefreshToken(stored.user.id);

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  // ── Private helpers ───────────────────────────────────────

  private generateAccessToken(userId: string, role: string): string {
    const expiresIn = this.config.get('JWT_EXPIRES_IN', '15m') as any;
    return this.jwt.sign({ sub: userId, role }, { expiresIn });
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }
}
