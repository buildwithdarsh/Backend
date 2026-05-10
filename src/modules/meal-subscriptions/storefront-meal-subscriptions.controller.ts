import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetOrg, GetEndUser } from '../../common/decorators/index.js';
import { MealSubscriptionsService } from './meal-subscriptions.service.js';
import { CreateMealSubscriptionDto } from './dto/index.js';

@ApiTags('Storefront - Meal Subscriptions')
@Controller('api/v1/storefront/meal-plans')
export class StorefrontMealSubscriptionsController {
  constructor(private readonly service: MealSubscriptionsService) {}

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to a meal plan' })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  subscribe(
    @GetOrg() orgId: string,
    @GetEndUser() endUserId: string,
    @Body() dto: CreateMealSubscriptionDto,
  ) {
    return this.service.subscribe(orgId, endUserId, dto);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'List my meal subscriptions' })
  @ApiResponse({ status: 200, description: 'User subscriptions list' })
  mySubscriptions(
    @GetOrg() orgId: string,
    @GetEndUser() endUserId: string,
  ) {
    return this.service.mySubscriptions(orgId, endUserId);
  }

  @Post('subscriptions/:id/cancel')
  @ApiOperation({ summary: 'Cancel a meal subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  cancel(
    @GetOrg() orgId: string,
    @GetEndUser() endUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.cancel(orgId, id, endUserId);
  }
}
