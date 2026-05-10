import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { PrismaService } from '../../database/prisma.service.js';
import { EndUserJwtGuard } from './guards/enduser-jwt.guard.js';
import { EndUserAuthService } from './end-user-auth.service.js';
import {
  EndUserRegisterDto,
  EndUserLoginDto,
  EndUserSendOtpDto,
  EndUserVerifyOtpDto,
  EndUserRefreshTokenDto,
  EndUserUpdateProfileDto,
  EndUserRequestResetDto,
  EndUserResetPasswordDto,
  EndUserAuthResponseDto,
  StartSignupDto,
  VerifySignupOtpDto,
  CompleteSignupDto,
} from './dto/index.js';

@ApiTags('Storefront Auth')
@Controller('api/v1/storefront/auth')
export class EndUserAuthController {
  constructor(
    private readonly authService: EndUserAuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new end user' })
  @ApiBody({ type: EndUserRegisterDto })
  @ApiResponse({ status: 201, description: 'User registered', type: EndUserAuthResponseDto })
  async register(@Body() dto: EndUserRegisterDto): Promise<EndUserAuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email/phone and password' })
  @ApiBody({ type: EndUserLoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: EndUserAuthResponseDto })
  async login(@Body() dto: EndUserLoginDto, @Req() req: Request): Promise<EndUserAuthResponseDto> {
    return this.authService.login(dto, req.ip, req.headers['user-agent']);
  }

  @UseGuards(EndUserJwtGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out and revoke refresh token' })
  @ApiBody({ type: EndUserRefreshTokenDto })
  async logout(
    @Body() dto: EndUserRefreshTokenDto,
    @Req() req: RequestWithOrg,
  ): Promise<{ message: string }> {
    const endUserId = req.endUser?.id ?? '';
    const orgId = req.orgId ?? '';
    await this.authService.logout(endUserId, orgId, dto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: EndUserRefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Tokens refreshed', type: EndUserAuthResponseDto })
  async refresh(
    @Body() dto: EndUserRefreshTokenDto,
    @Req() req: Request,
  ): Promise<EndUserAuthResponseDto> {
    return this.authService.refreshTokens(dto.refreshToken, req.ip, req.headers['user-agent']);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone/email' })
  @ApiBody({ type: EndUserSendOtpDto })
  async sendOtp(@Body() dto: EndUserSendOtpDto): Promise<{ message: string }> {
    return this.authService.sendOtp(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and receive tokens' })
  @ApiBody({ type: EndUserVerifyOtpDto })
  @ApiResponse({ status: 200, description: 'OTP verified', type: EndUserAuthResponseDto })
  async verifyOtp(
    @Body() dto: EndUserVerifyOtpDto,
    @Req() req: Request,
  ): Promise<EndUserAuthResponseDto> {
    return this.authService.verifyOtp(dto, req.ip, req.headers['user-agent']);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post('request-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({ type: EndUserRequestResetDto })
  async requestReset(@Body() dto: EndUserRequestResetDto): Promise<{ message: string }> {
    return this.authService.requestPasswordReset(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiBody({ type: EndUserResetPasswordDto })
  async resetPassword(@Body() dto: EndUserResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(EndUserJwtGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: RequestWithOrg) {
    const endUserId = req.endUser?.id ?? '';
    const orgId = req.orgId ?? '';
    return this.authService.getProfile(endUserId, orgId);
  }

  @UseGuards(EndUserJwtGuard)
  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBody({ type: EndUserUpdateProfileDto })
  async updateProfile(
    @Body() dto: EndUserUpdateProfileDto,
    @Req() req: RequestWithOrg,
  ) {
    const endUserId = req.endUser?.id ?? '';
    const orgId = req.orgId ?? '';
    return this.authService.updateProfile(endUserId, orgId, dto);
  }

  @UseGuards(EndUserJwtGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password (authenticated)' })
  async changePassword(
    @Body() dto: { currentPassword: string; newPassword: string },
    @Req() req: RequestWithOrg,
  ) {
    const endUserId = req.endUser?.id ?? '';
    const orgId = req.orgId ?? '';
    return this.authService.changePassword(endUserId, orgId, dto.currentPassword, dto.newPassword);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Alias for request-reset' })
  async forgotPassword(@Body() dto: EndUserRequestResetDto): Promise<{ message: string }> {
    return this.authService.requestPasswordReset(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('demo-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with a pre-configured demo account' })
  @ApiResponse({ status: 200, description: 'Demo login successful', type: EndUserAuthResponseDto })
  async demoLogin(
    @Body() body: { orgSlug: string },
    @Req() req: Request,
  ): Promise<EndUserAuthResponseDto> {
    return this.authService.demoLogin(body.orgSlug, req.ip, req.headers['user-agent']);
  }

  // ─── Step-tracked Signup Flow ─────────────────────────────────────────────

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post('start-signup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Step 1: Start signup with phone, sends OTP' })
  @ApiBody({ type: StartSignupDto })
  async startSignup(@Body() dto: StartSignupDto) {
    return this.authService.startSignup(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('verify-signup-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Step 2: Verify signup OTP, returns temp tokens' })
  @ApiBody({ type: VerifySignupOtpDto })
  async verifySignupOtp(@Body() dto: VerifySignupOtpDto, @Req() req: Request) {
    return this.authService.verifySignupOtp(dto, req.ip, req.headers['user-agent']);
  }

  @UseGuards(EndUserJwtGuard)
  @Post('complete-signup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Step 3: Complete signup with name, email, password' })
  @ApiBody({ type: CompleteSignupDto })
  @ApiResponse({ status: 200, description: 'Signup completed', type: EndUserAuthResponseDto })
  async completeSignup(
    @Body() dto: CompleteSignupDto,
    @Req() req: RequestWithOrg,
  ): Promise<EndUserAuthResponseDto> {
    const endUserId = req.endUser?.id ?? '';
    const orgId = req.orgId ?? '';
    return this.authService.completeSignup(endUserId, orgId, dto, req.ip, req.headers['user-agent']);
  }

  // ─── Social Login ────────────────────────────────────────────────────────

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  async googleAuth() {
    // Passport redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(
    @Req() req: any,
    @Headers('x-org-slug') orgSlug: string,
  ) {
    const org = await this.resolveOrgBySlug(orgSlug);
    return this.authService.socialLogin(org.id, 'google', req.user);
  }

  @Public()
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Initiate Facebook OAuth flow' })
  async facebookAuth() {
    // Passport redirects to Facebook
  }

  @Public()
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Facebook OAuth callback' })
  async facebookAuthCallback(
    @Req() req: any,
    @Headers('x-org-slug') orgSlug: string,
  ) {
    const org = await this.resolveOrgBySlug(orgSlug);
    return this.authService.socialLogin(org.id, 'facebook', req.user);
  }

  // ─── Private helpers ────────────────────────────────────────────────────

  private async resolveOrgBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }
}
