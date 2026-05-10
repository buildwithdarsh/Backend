import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AppSubscriptionsService } from './app-subscriptions.service.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { GetOrg } from '../../common/decorators/index.js';
import { CreateAppSubscriptionDto, ActivateAppSubscriptionDto } from './dto.js';

@Controller('api/v1/storefront/subscriptions')
export class AppSubscriptionsController {
  constructor(private readonly service: AppSubscriptionsService) {}

  /** Public — no auth needed to see plans */
  @Get('plans')
  getPlans(@GetOrg() orgId: string) {
    return this.service.getPlans(orgId);
  }

  @Post()
  @UseGuards(EndUserJwtGuard)
  create(@Req() req: any, @GetOrg() orgId: string, @Body() dto: CreateAppSubscriptionDto) {
    return this.service.create(req.endUser.id, orgId, dto);
  }

  @Post(':id/activate')
  @UseGuards(EndUserJwtGuard)
  activate(@Param('id') id: string, @Req() req: any, @Body() dto: ActivateAppSubscriptionDto) {
    return this.service.activate(id, dto, req.endUser.id);
  }

  @Post(':id/cancel')
  @UseGuards(EndUserJwtGuard)
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.service.cancel(id, req.endUser.id);
  }

  @Get('active')
  @UseGuards(EndUserJwtGuard)
  getActive(@Req() req: any, @GetOrg() orgId: string) {
    return this.service.getActive(req.endUser.id, orgId);
  }
}
