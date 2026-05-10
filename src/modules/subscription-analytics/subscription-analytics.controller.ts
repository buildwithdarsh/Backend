import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GetOrg, GetEndUser } from '../../common/decorators/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { SubscriptionAnalyticsService } from './subscription-analytics.service.js';

@ApiTags('Storefront - Subscription Analytics')
@Controller('api/v1/storefront/subscription-analytics')
@UseGuards(EndUserJwtGuard)
export class SubscriptionAnalyticsController {
  constructor(private readonly service: SubscriptionAnalyticsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Overall spending summary' })
  async summary(
    @GetOrg() orgId: string,
    @GetEndUser('id') endUserId: string,
  ) {
    return this.service.getSummary(orgId, endUserId);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Monthly spending trend (last N months)' })
  @ApiQuery({ name: 'months', required: false, type: Number })
  async trends(
    @GetOrg() orgId: string,
    @GetEndUser('id') endUserId: string,
    @Query('months') months?: string,
  ) {
    return this.service.getTrends(orgId, endUserId, months ? parseInt(months, 10) : 6);
  }
}
