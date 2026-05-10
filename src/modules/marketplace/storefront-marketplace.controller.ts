import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { GetOrg } from '../../common/decorators/index.js';
import {
  CreateProfileDto, UpdateProfileDto,
  CreateOpportunityDto, UpdateOpportunityDto,
  CreateBookingDto, UpdateBookingStatusDto,
  CreateReviewDto, SaveOnboardingDto,
} from './dto/index.js';

@Controller('api/v1/storefront/marketplace')
export class StorefrontMarketplaceController {
  constructor(private readonly service: MarketplaceService) {}

  // ─── Profile ────────────────────────────────────────────────────────────
  @Post('profile')
  @UseGuards(EndUserJwtGuard)
  createProfile(@Req() req: any, @GetOrg() orgId: string, @Body() dto: CreateProfileDto) {
    return this.service.createProfile(req.endUser.id, orgId, dto);
  }

  @Get('profile')
  @UseGuards(EndUserJwtGuard)
  getProfile(@Req() req: any, @GetOrg() orgId: string) {
    return this.service.getProfile(req.endUser.id, orgId);
  }

  @Put('profile')
  @UseGuards(EndUserJwtGuard)
  updateProfile(@Req() req: any, @GetOrg() orgId: string, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(req.endUser.id, orgId, dto);
  }

  @Get('profiles')
  @UseGuards(EndUserJwtGuard)
  searchProfiles(@GetOrg() orgId: string, @Query() filters: any) {
    return this.service.searchProfiles(orgId, filters);
  }

  @Get('profiles/:id')
  @UseGuards(EndUserJwtGuard)
  getProfileById(@GetOrg() orgId: string, @Param('id') id: string, @Req() req: any) {
    return this.service.getProfileById(orgId, id, req.endUser?.id);
  }

  // ─── Opportunities ──────────────────────────────────────────────────────
  @Post('opportunities')
  @UseGuards(EndUserJwtGuard)
  createOpportunity(@Req() req: any, @GetOrg() orgId: string, @Body() dto: CreateOpportunityDto) {
    return this.service.createOpportunity(req.endUser.id, orgId, dto);
  }

  @Get('opportunities')
  searchOpportunities(@GetOrg() orgId: string, @Query() dto: any) {
    return this.service.searchOpportunities(orgId, dto);
  }

  @Get('opportunities/mine')
  @UseGuards(EndUserJwtGuard)
  getMyOpportunities(@Req() req: any, @GetOrg() orgId: string) {
    return this.service.getMyOpportunities(req.endUser.id, orgId);
  }

  @Get('opportunities/:id')
  getOpportunity(@Param('id') id: string, @GetOrg() orgId: string, @Req() req: any) {
    return this.service.getOpportunity(id, orgId, req.endUser?.id);
  }

  @Put('opportunities/:id')
  @UseGuards(EndUserJwtGuard)
  updateOpportunity(@Param('id') id: string, @Req() req: any, @GetOrg() orgId: string, @Body() dto: UpdateOpportunityDto) {
    return this.service.updateOpportunity(id, req.endUser.id, orgId, dto);
  }

  // ─── Bookings ───────────────────────────────────────────────────────────
  @Post('bookings')
  @UseGuards(EndUserJwtGuard)
  createBooking(@Req() req: any, @GetOrg() orgId: string, @Body() dto: CreateBookingDto) {
    return this.service.createBooking(req.endUser.id, orgId, dto);
  }

  @Get('bookings')
  @UseGuards(EndUserJwtGuard)
  getMyBookings(@Req() req: any, @GetOrg() orgId: string, @Query('role') role?: 'experiencer' | 'provider') {
    return this.service.getMyBookings(req.endUser.id, orgId, role);
  }

  @Patch('bookings/:id/status')
  @UseGuards(EndUserJwtGuard)
  updateBookingStatus(@Param('id') id: string, @Req() req: any, @GetOrg() orgId: string, @Body() dto: UpdateBookingStatusDto) {
    return this.service.updateBookingStatus(id, req.endUser.id, orgId, dto);
  }

  // ─── Connect (profile-to-profile booking without opportunity) ────────────
  @Post('connect')
  @UseGuards(EndUserJwtGuard)
  connect(@Req() req: any, @GetOrg() orgId: string, @Body() dto: { profileId: string; date: string; startTime?: string; durationHours: number; message?: string }) {
    return this.service.connectWithProfile(req.endUser.id, orgId, dto);
  }

  // ─── Reviews ────────────────────────────────────────────────────────────
  @Post('reviews')
  @UseGuards(EndUserJwtGuard)
  createReview(@Req() req: any, @GetOrg() orgId: string, @Body() dto: CreateReviewDto) {
    return this.service.createReview(req.endUser.id, orgId, dto);
  }

  @Get('reviews/:userId')
  @UseGuards(EndUserJwtGuard)
  getReviews(@Param('userId') userId: string, @GetOrg() orgId: string) {
    return this.service.getReviewsForUser(userId, orgId);
  }

  // ─── Matches ────────────────────────────────────────────────────────────
  @Get('matches')
  @UseGuards(EndUserJwtGuard)
  getMatches(@Req() req: any, @GetOrg() orgId: string) {
    return this.service.getMatches(req.endUser.id, orgId);
  }

  // ─── Onboarding ─────────────────────────────────────────────────────────
  @Post('onboarding')
  @UseGuards(EndUserJwtGuard)
  saveOnboarding(@Req() req: any, @GetOrg() orgId: string, @Body() dto: SaveOnboardingDto) {
    return this.service.saveOnboarding(req.endUser.id, orgId, dto);
  }

  @Get('onboarding')
  @UseGuards(EndUserJwtGuard)
  getOnboarding(@Req() req: any, @GetOrg() orgId: string) {
    return this.service.getOnboarding(req.endUser.id, orgId);
  }
}
