import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type Response } from 'express';
import { GetOrg } from '../../common/decorators/index.js';
import { SpinWheelsService } from './spin-wheels.service.js';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  UpdateCampaignStatusDto,
  UpdateSliceDto,
  ReorderSlicesDto,
  QueryCampaignsDto,
  QueryLeadsDto,
  QueryAnalyticsDto,
} from './dto/index.js';

@ApiTags('Admin - SpinWheel')
@Controller('api/v1/shopify/spinwheel/campaigns')
export class AdminSpinWheelsController {
  constructor(private readonly spinWheelsService: SpinWheelsService) {}

  // ─── Campaigns ────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all campaigns with filters & pagination' })
  @ApiResponse({ status: 200, description: 'Paginated campaign list' })
  findAll(@GetOrg() orgId: string, @Query() query: QueryCampaignsDto) {
    return this.spinWheelsService.findAllCampaigns(orgId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new spin wheel campaign with slices' })
  @ApiResponse({ status: 201, description: 'Campaign created' })
  create(@GetOrg() orgId: string, @Body() dto: CreateCampaignDto) {
    return this.spinWheelsService.createCampaign(orgId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID with slices' })
  @ApiResponse({ status: 200, description: 'Campaign details' })
  findOne(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.spinWheelsService.findCampaignById(orgId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update campaign settings' })
  @ApiResponse({ status: 200, description: 'Campaign updated' })
  update(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.spinWheelsService.updateCampaign(orgId, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update campaign status (DRAFT → ACTIVE → PAUSED → ENDED)' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  updateStatus(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCampaignStatusDto,
  ) {
    return this.spinWheelsService.updateCampaignStatus(orgId, id, dto.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a campaign' })
  @ApiResponse({ status: 204, description: 'Campaign deleted' })
  remove(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.spinWheelsService.deleteCampaign(orgId, id);
  }

  // ─── Slices ───────────────────────────────────────────────────────────────

  @Post(':id/slices')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a slice to campaign' })
  addSlice(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) campaignId: string,
    @Body() dto: UpdateSliceDto & { label: string; color: string; prizeType: string; probability: number },
  ) {
    return this.spinWheelsService.addSlice(orgId, campaignId, dto);
  }

  @Put(':id/slices/:sliceId')
  @ApiOperation({ summary: 'Update a slice' })
  updateSlice(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) campaignId: string,
    @Param('sliceId', ParseUUIDPipe) sliceId: string,
    @Body() dto: UpdateSliceDto,
  ) {
    return this.spinWheelsService.updateSlice(orgId, campaignId, sliceId, dto);
  }

  @Delete(':id/slices/:sliceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a slice' })
  deleteSlice(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) campaignId: string,
    @Param('sliceId', ParseUUIDPipe) sliceId: string,
  ) {
    return this.spinWheelsService.deleteSlice(orgId, campaignId, sliceId);
  }

  @Put(':id/slices/reorder')
  @ApiOperation({ summary: 'Reorder slices' })
  reorderSlices(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) campaignId: string,
    @Body() dto: ReorderSlicesDto,
  ) {
    return this.spinWheelsService.reorderSlices(orgId, campaignId, dto);
  }

  // ─── Analytics ────────────────────────────────────────────────────────────

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get campaign analytics (daily + totals)' })
  getCampaignAnalytics(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) campaignId: string,
    @Query() query: QueryAnalyticsDto,
  ) {
    return this.spinWheelsService.getCampaignAnalytics(orgId, campaignId, query);
  }

  // ─── Leads ────────────────────────────────────────────────────────────────

  @Get(':id/leads')
  @ApiOperation({ summary: 'List captured leads for a campaign' })
  getLeads(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) campaignId: string,
    @Query() query: QueryLeadsDto,
  ) {
    return this.spinWheelsService.getLeads(orgId, campaignId, query);
  }

  @Get(':id/leads/export')
  @ApiOperation({ summary: 'Export leads as CSV' })
  async exportLeads(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) campaignId: string,
    @Res() res: Response,
  ) {
    const csv = await this.spinWheelsService.exportLeads(orgId, campaignId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="leads-${campaignId}.csv"`);
    res.send(csv);
  }
}

// Separate controller for overview analytics (different path)
@ApiTags('Admin - SpinWheel')
@Controller('api/v1/shopify/spinwheel/analytics')
export class AdminSpinWheelAnalyticsController {
  constructor(private readonly spinWheelsService: SpinWheelsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get analytics overview across all campaigns' })
  getOverview(@GetOrg() orgId: string, @Query('shopDomain') shopDomain?: string) {
    return this.spinWheelsService.getAnalyticsOverview(orgId, shopDomain);
  }
}
