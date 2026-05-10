import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { LoyaltyService } from './loyalty.service.js';
import { RedeemRewardDto } from './dto/index.js';

@ApiTags('Storefront - Loyalty')
@UseGuards(EndUserJwtGuard)
@Controller('api/v1/storefront/loyalty')
export class StorefrontLoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get()
  @ApiOperation({ summary: 'Get loyalty account and balance' })
  @ApiResponse({ status: 200, description: 'Loyalty account details' })
  getAccount(@Req() req: RequestWithOrg) {
    return this.loyaltyService.getAccount(req.orgId, req.endUser!.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List loyalty transactions' })
  @ApiResponse({ status: 200, description: 'Paginated transactions' })
  getTransactions(
    @Req() req: RequestWithOrg,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.loyaltyService.getTransactions(
      req.orgId,
      req.endUser!.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('rewards')
  @ApiOperation({ summary: 'List available rewards catalog' })
  @ApiResponse({ status: 200, description: 'Active rewards list' })
  getRewards(@Req() req: RequestWithOrg) {
    return this.loyaltyService.getRewards(req.orgId);
  }

  @Get('redeem')
  @ApiOperation({ summary: 'Get active redemptions' })
  @ApiResponse({ status: 200, description: 'Active redemptions list' })
  getActiveRedemptions(@Req() req: RequestWithOrg) {
    return this.loyaltyService.getActiveRedemptions(req.orgId, req.endUser?.id ?? '');
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem a reward using loyalty points' })
  @ApiResponse({ status: 201, description: 'Reward redeemed' })
  @ApiResponse({ status: 400, description: 'Insufficient points' })
  @ApiResponse({ status: 404, description: 'Reward not found' })
  redeemReward(@Req() req: RequestWithOrg, @Body() dto: RedeemRewardDto) {
    return this.loyaltyService.redeemReward(req.orgId, req.endUser!.id, dto.rewardId);
  }
}
