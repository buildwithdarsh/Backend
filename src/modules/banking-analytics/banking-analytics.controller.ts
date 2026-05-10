import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/index.js';
import { GetOrg } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { BankingAnalyticsService } from './banking-analytics.service.js';
import type { SetBudgetDto } from './dto/banking-analytics.dto.js';

@ApiTags('Storefront - Banking Analytics')
@Controller('api/v1/storefront/banking/analytics')
@UseGuards(EndUserJwtGuard)
export class BankingAnalyticsController {
  constructor(private readonly analyticsService: BankingAnalyticsService) {}

  @Get('spending')
  @ApiOperation({ summary: 'Get categorized spending breakdown with trends' })
  async getSpendingBreakdown(
    @Req() req: RequestWithOrg,
    @Query('months', new DefaultValuePipe(1), ParseIntPipe) months: number,
  ) {
    return this.analyticsService.getSpendingBreakdown(req.orgId, req.endUser!.id, months);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get monthly income vs expenditure trends' })
  async getMonthlyTrends(
    @Req() req: RequestWithOrg,
    @Query('months', new DefaultValuePipe(6), ParseIntPipe) months: number,
  ) {
    return this.analyticsService.getMonthlyTrends(req.orgId, req.endUser!.id, months);
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Get cash flow summary for a period' })
  async getCashFlowSummary(
    @Req() req: RequestWithOrg,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getCashFlowSummary(
      req.orgId,
      req.endUser!.id,
      startDate,
      endDate,
    );
  }

  @Get('net-worth')
  @ApiOperation({ summary: 'Get net worth snapshot (accounts + FDs)' })
  async getNetWorthSnapshot(@Req() req: RequestWithOrg) {
    return this.analyticsService.getNetWorthSnapshot(req.orgId, req.endUser!.id);
  }

  // ─── Budgets ────────────────────────────────────────────────────────

  @Get('budgets')
  @ApiOperation({ summary: 'List budgets with current utilization' })
  async listBudgets(@Req() req: RequestWithOrg) {
    return this.analyticsService.listBudgets(req.orgId, req.endUser!.id);
  }

  @Post('budgets')
  @ApiOperation({ summary: 'Set a budget for a spending category' })
  async setBudget(
    @Req() req: RequestWithOrg,
    @Body() body: SetBudgetDto,
  ) {
    return this.analyticsService.setBudget(req.orgId, req.endUser!.id, body);
  }

  @Delete('budgets/:category')
  @ApiOperation({ summary: 'Deactivate a budget' })
  async deleteBudget(
    @Req() req: RequestWithOrg,
    @Param('category') category: string,
  ) {
    return this.analyticsService.deleteBudget(req.orgId, req.endUser!.id, category);
  }

  // ─── Anomaly Alerts ─────────────────────────────────────────────────

  @Get('alerts')
  @ApiOperation({ summary: 'Get anomaly/spending alerts' })
  async getAnomalyAlerts(
    @Req() req: RequestWithOrg,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('unreadOnly', new DefaultValuePipe(false), ParseBoolPipe) unreadOnly: boolean,
  ) {
    return this.analyticsService.getAnomalyAlerts(
      req.orgId,
      req.endUser!.id,
      page,
      Math.min(limit, 100),
      unreadOnly,
    );
  }

  @Post('alerts/:id/read')
  @ApiOperation({ summary: 'Mark an alert as read' })
  async markAlertRead(
    @Req() req: RequestWithOrg,
    @Param('id') id: string,
  ) {
    return this.analyticsService.markAlertRead(req.orgId, req.endUser!.id, id);
  }

  @Post('alerts/:id/dismiss')
  @ApiOperation({ summary: 'Dismiss an alert' })
  async dismissAlert(
    @Req() req: RequestWithOrg,
    @Param('id') id: string,
  ) {
    return this.analyticsService.dismissAlert(req.orgId, req.endUser!.id, id);
  }

  // ─── Categories ─────────────────────────────────────────────────────

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'Get spending categories' })
  async getSpendingCategories(@GetOrg() orgId: string) {
    return this.analyticsService.getSpendingCategories(orgId);
  }
}
