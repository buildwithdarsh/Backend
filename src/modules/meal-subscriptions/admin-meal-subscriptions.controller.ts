import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetOrg } from '../../common/decorators/index.js';
import { MealSubscriptionsService } from './meal-subscriptions.service.js';
import { QueryMealSubscriptionsDto } from './dto/index.js';

@ApiTags('Admin - Meal Subscriptions')
@Controller('api/v1/subscriptions')
export class AdminMealSubscriptionsController {
  constructor(private readonly service: MealSubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all meal subscriptions with filters & pagination' })
  @ApiResponse({ status: 200, description: 'Paginated meal subscriptions list' })
  findAll(@GetOrg() orgId: string, @Query() query: QueryMealSubscriptionsDto) {
    return this.service.findAll(orgId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single meal subscription' })
  @ApiResponse({ status: 200, description: 'Meal subscription details' })
  findOne(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(orgId, id);
  }
}
