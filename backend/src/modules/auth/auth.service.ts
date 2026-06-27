import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: number;
  email: string;
  role: number;
  vendorId: number | null;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.users.findFirst({
      where: { email, status: 1 },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    // Check if 2FA is enabled
    if (user.two_factor_enabled) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      await this.prisma.users.update({
        where: { id: user.id },
        data: { two_factor_code: otpCode },
      });
      // TODO: Send OTP email
      return { requiresOtp: true, userId: user.id };
    }

    const tokens = await this.generateTokens(user);

    // Log login
    await this.prisma.login_logs.create({
      data: {
        uid: uuidv4(),
        users_id: user.id,
        ip_address: '0.0.0.0',
        user_agent: '',
        logged_in_at: new Date(),
      },
    });

    return {
      requiresOtp: false,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.user_roles_id,
        vendorId: user.vendors_id,
      },
      ...tokens,
    };
  }

  async verifyOtp(userId: number, otpCode: string) {
    const user = await this.prisma.users.findFirst({
      where: { id: userId, two_factor_code: otpCode },
    });

    if (!user) throw new UnauthorizedException('Invalid OTP code');

    await this.prisma.users.update({
      where: { id: user.id },
      data: { two_factor_code: null },
    });

    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.user_roles_id,
        vendorId: user.vendors_id,
      },
      ...tokens,
    };
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string; vendorId?: number }) {
    const existing = await this.prisma.users.findFirst({
      where: { email: data.email },
    });
    if (existing) throw new BadRequestException('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.users.create({
      data: {
        uid: uuidv4(),
        email: data.email,
        password: hashedPassword,
        first_name: data.firstName,
        last_name: data.lastName,
        user_roles_id: data.vendorId ? 2 : 1,
        vendors_id: data.vendorId || null,
        status: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    const tokens = await this.generateTokens(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.user_roles_id,
        vendorId: user.vendors_id,
      },
      ...tokens,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.users.findFirst({ where: { email } });
    if (!user) throw new BadRequestException('Email not found');

    const resetToken = uuidv4();
    await this.prisma.users.update({
      where: { id: user.id },
      data: { remember_token: resetToken },
    });

    // TODO: Send reset email
    return { message: 'Password reset link sent to your email' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.users.findFirst({
      where: { remember_token: token },
    });
    if (!user) throw new BadRequestException('Invalid or expired reset token');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.users.update({
      where: { id: user.id },
      data: { password: hashedPassword, remember_token: null },
    });

    return { message: 'Password reset successfully' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'wabapanel-refresh-secret'),
      });
      const user = await this.prisma.users.findFirst({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('Invalid token');
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: number) {
    const user = await this.prisma.users.findFirst({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        user_roles_id: true,
        vendors_id: true,
        created_at: true,
      },
    });
    return user;
  }

  async updateProfile(userId: number, data: { firstName?: string; lastName?: string; email?: string }) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        ...(data.firstName && { first_name: data.firstName }),
        ...(data.lastName && { last_name: data.lastName }),
        ...(data.email && { email: data.email }),
        updated_at: new Date(),
      },
    });
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.prisma.users.findFirst({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new BadRequestException('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword, updated_at: new Date() },
    });

    return { message: 'Password changed successfully' };
  }

  private async generateTokens(user: { id: number; email: string; user_roles_id: number | null; vendors_id: number | null }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.user_roles_id || 2,
      vendorId: user.vendors_id,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1d' });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'wabapanel-refresh-secret'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
