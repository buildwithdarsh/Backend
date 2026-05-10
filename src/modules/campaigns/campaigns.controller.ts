import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service.js';
import { CreateCampaignDto } from './dto/create-campaign.dto.js';
import { UpdateCampaignDto } from './dto/update-campaign.dto.js';
import { QueryCampaignsDto } from './dto/query-campaigns.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { GetOrg, GetUser } from '../../common/decorators/index.js';

@ApiTags('Campaigns')
@Controller('api/v1/campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  @ApiOperation({ summary: 'List all campaigns (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated campaign list' })
  findAll(@GetOrg() orgId: string, @Query() dto: QueryCampaignsDto) {
    return this.campaignsService.findAll(orgId, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created with status=draft' })
  create(
    @GetOrg() orgId: string,
    @GetUser('id') userId: string,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.campaignsService.create(orgId, dto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign details with analytics summary' })
  @ApiResponse({ status: 200, description: 'Campaign details with analytics' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  findOne(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaignsService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a draft campaign' })
  @ApiResponse({ status: 200, description: 'Campaign updated' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiResponse({ status: 409, description: 'Campaign is not in draft status' })
  update(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a draft campaign' })
  @ApiResponse({ status: 200, description: 'Campaign deleted' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiResponse({ status: 409, description: 'Campaign is not in draft status' })
  remove(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaignsService.remove(orgId, id);
  }

  @Post(':id/launch')
  @ApiOperation({ summary: 'Launch a campaign (validate, resolve audience, queue jobs)' })
  @ApiResponse({ status: 200, description: 'Campaign launched' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiResponse({ status: 409, description: 'Campaign cannot be launched in current status' })
  launch(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaignsService.launch(orgId, id);
  }

  @Post(':id/schedule')
  @ApiOperation({ summary: 'Schedule a draft campaign for future delivery' })
  @ApiResponse({ status: 200, description: 'Campaign scheduled' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiResponse({ status: 409, description: 'Campaign is not in draft status' })
  schedule(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('scheduledAt') scheduledAt: string,
    @Body('timezone') timezone?: string,
  ) {
    return this.campaignsService.schedule(orgId, id, scheduledAt, timezone);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a running campaign' })
  @ApiResponse({ status: 200, description: 'Campaign paused' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiResponse({ status: 409, description: 'Campaign is not running' })
  pause(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaignsService.pause(orgId, id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a paused campaign' })
  @ApiResponse({ status: 200, description: 'Campaign resumed' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiResponse({ status: 409, description: 'Campaign is not paused' })
  resume(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaignsService.resume(orgId, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a scheduled campaign' })
  @ApiResponse({ status: 200, description: 'Campaign cancelled' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiResponse({ status: 409, description: 'Campaign is not scheduled' })
  cancel(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaignsService.cancel(orgId, id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get paginated delivery logs for a campaign' })
  @ApiResponse({ status: 200, description: 'Paginated campaign delivery logs' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  getLogs(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() dto: PaginationDto,
  ) {
    return this.campaignsService.getLogs(orgId, id, dto);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get full analytics for a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign analytics' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  getAnalytics(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaignsService.getAnalytics(orgId, id);
  }
}
