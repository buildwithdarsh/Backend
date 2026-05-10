import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { EarningsService } from './earnings.service.js';

@ApiTags('Storefront - Earnings')
@Controller('api/v1/storefront/earnings')
@UseGuards(EndUserJwtGuard)
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get earnings summary for the authenticated host' })
  async getSummary(@Req() req: RequestWithOrg) {
    return this.earningsService.getSummary(req.orgId, req.endUser!.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get paginated earnings history' })
  async getHistory(
    @Req() req: RequestWithOrg,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.earningsService.getHistory(
      req.orgId,
      req.endUser!.id,
      page,
      limit,
    );
  }
}
