import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetOrg, GetEndUser } from '../../common/decorators/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { SubscriptionAlertsService } from './subscription-alerts.service.js';
import { QuerySubscriptionAlertsDto } from './dto/index.js';

@ApiTags('Storefront - Subscription Alerts')
@Controller('api/v1/storefront/subscription-alerts')
@UseGuards(EndUserJwtGuard)
export class SubscriptionAlertsController {
  constructor(private readonly service: SubscriptionAlertsService) {}

  @Get()
  @ApiOperation({ summary: 'List subscription alerts' })
  async list(
    @GetOrg() orgId: string,
    @GetEndUser('id') endUserId: string,
    @Query() query: QuerySubscriptionAlertsDto,
  ) {
    return this.service.findAll(orgId, endUserId, query);
  }

  @Post(':id/dismiss')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dismiss an alert' })
  async dismiss(
    @GetOrg() orgId: string,
    @GetEndUser('id') endUserId: string,
    @Param('id') alertId: string,
  ) {
    return this.service.dismiss(orgId, endUserId, alertId);
  }

  @Post('dismiss-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dismiss all alerts' })
  async dismissAll(
    @GetOrg() orgId: string,
    @GetEndUser('id') endUserId: string,
  ) {
    return this.service.dismissAll(orgId, endUserId);
  }
}
