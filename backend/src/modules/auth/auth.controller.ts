import { Controller, Post, Body, Get, UseGuards, Req, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public, CurrentUser } from '../../common/decorators';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(200)
  async verifyOtp(@Body() body: { userId: number; otpCode: string }) {
    return this.authService.verifyOtp(body.userId, body.otpCode);
  }

  @Public()
  @Post('register')
  async register(@Body() body: { email: string; password: string; firstName: string; lastName: string }) {
    return this.authService.register(body);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Post('refresh')
  @HttpCode(200)
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser('sub') userId: number) {
    return this.authService.getProfile(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('profile')
  async updateProfile(
    @CurrentUser('sub') userId: number,
    @Body() body: { firstName?: string; lastName?: string; email?: string },
  ) {
    return this.authService.updateProfile(userId, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(200)
  async changePassword(
    @CurrentUser('sub') userId: number,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(userId, body.currentPassword, body.newPassword);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout() {
    return { message: 'Logged out successfully' };
  }
}
