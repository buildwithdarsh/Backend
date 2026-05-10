import { Controller, Get, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service.js';
import { JwtAuthGuard } from '../../common/guards/index.js';
import { GetOrg } from '../../common/decorators/index.js';
import { UpdateProfileDto, UpdateOpportunityDto } from './dto/index.js';

@Controller('api/v1/admin/marketplace')
@UseGuards(JwtAuthGuard)
export class AdminMarketplaceController {
  constructor(private readonly service: MarketplaceService) {}

  @Get('stats')
  getStats(@GetOrg() orgId: string) {
    return this.service.getAdminStats(orgId);
  }

  @Get('profiles')
  listProfiles(@GetOrg() orgId: string, @Query() filters: any) {
    return this.service.searchProfiles(orgId, filters);
  }

  @Get('profiles/:id')
  getProfile(@GetOrg() orgId: string, @Param('id') id: string) {
    return this.service.getProfileById(orgId, id);
  }

  @Put('profiles/:userId')
  updateProfile(@GetOrg() orgId: string, @Param('userId') userId: string, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(userId, orgId, dto);
  }

  @Delete('profiles/:userId')
  deactivateProfile(@GetOrg() orgId: string, @Param('userId') userId: string) {
    return this.service.updateProfile(userId, orgId, { isActive: false });
  }

  @Get('opportunities')
  listOpportunities(@GetOrg() orgId: string, @Query() filters: any) {
    return this.service.searchOpportunities(orgId, filters);
  }

  @Put('opportunities/:id')
  updateOpportunity(@GetOrg() orgId: string, @Param('id') id: string, @Body() dto: UpdateOpportunityDto) {
    return this.service.adminUpdateOpportunity(id, orgId, dto);
  }

  @Delete('opportunities/:id')
  closeOpportunity(@GetOrg() orgId: string, @Param('id') id: string) {
    return this.service.adminUpdateOpportunity(id, orgId, { status: 'closed' });
  }

  @Get('bookings')
  listBookings(@GetOrg() orgId: string, @Query() filters: any) {
    return this.service.adminListBookings(orgId, filters);
  }

  @Get('onboarding')
  listOnboarding(@GetOrg() orgId: string, @Query() filters: any) {
    return this.service.adminListOnboarding(orgId, filters);
  }

  @Get('reviews')
  listReviews(@GetOrg() orgId: string, @Query() filters: any) {
    return this.service.adminListReviews(orgId, filters);
  }
}
