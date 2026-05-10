import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsageService } from './usage.service.js';
import { QueryUsageDto } from './dto/query-usage.dto.js';
import { GetOrg } from '../../common/decorators/index.js';

@ApiTags('Usage')
@Controller('api/v1/usage')
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get()
  @ApiOperation({ summary: 'Get current period usage summary' })
  @ApiResponse({ status: 200, description: 'Usage summary for the current billing period' })
  getSummary(@GetOrg() orgId: string) {
    return this.usageService.getSummary(orgId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get paginated usage history' })
  @ApiResponse({ status: 200, description: 'Paginated usage log entries' })
  getHistory(@GetOrg() orgId: string, @Query() dto: QueryUsageDto) {
    return this.usageService.getHistory(orgId, dto);
  }

  @Get('breakdown')
  @ApiOperation({ summary: 'Get per-resource usage breakdown' })
  @ApiResponse({ status: 200, description: 'Usage breakdown by resource type' })
  getBreakdown(@GetOrg() orgId: string, @Query() dto: QueryUsageDto) {
    return this.usageService.getBreakdown(orgId, dto);
  }
}
