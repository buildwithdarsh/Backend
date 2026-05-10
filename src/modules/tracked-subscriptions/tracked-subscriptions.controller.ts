import {
  Controller,
  Delete,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetOrg, GetEndUser } from '../../common/decorators/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { TrackedSubscriptionsService } from './tracked-subscriptions.service.js';
import {
  AddTrackedSubscriptionDto,
  UpdateTrackedSubscriptionDto,
  QueryTrackedSubscriptionsDto,
} from './dto/index.js';

@ApiTags('Storefront - Tracked Subscriptions')
@Controller('api/v1/storefront/tracked-subscriptions')
@UseGuards(EndUserJwtGuard)
export class TrackedSubscriptionsController {
  constructor(private readonly service: TrackedSubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'List tracked subscriptions' })
  async list(
    @GetOrg() orgId: string,
    @GetEndUser('id') endUserId: string,
    @Query() query: QueryTrackedSubscriptionsDto,
  ) {
    return this.service.findAll(orgId, endUserId, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Monthly spending summary' })
  async summary(
    @GetOrg() orgId: string,
    @GetEndUser('id') endUserId: string,
  ) {
    return this.service.summary(orgId, endUserId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single tracked subscription' })
  async findOne(
    @GetOrg() orgId: string,
    @GetEndUser('id') endUserId: string,
    @Param('id') id: string,
  ) {
    return this.service.findOne(orgId, endUserId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Manually add a subscription' })
  async create(
    @GetOrg() orgId: string,
    @GetEndUser('id') endUserId: string,
    @Body() dto: AddTrackedSubscriptionDto,
  ) {
    return this.service.create(orgId, endUserId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tracked subscription' })
  async update(
    @GetOrg() orgId: string,
    @GetEndUser('id') endUserId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTrackedSubscriptionDto,
  ) {
    return this.service.update(orgId, endUserId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a tracked subscription' })
  async remove(
    @GetOrg() orgId: string,
    @GetEndUser('id') endUserId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(orgId, endUserId, id);
  }
}
