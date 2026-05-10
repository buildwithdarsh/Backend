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
import { GetOrg } from '../../common/decorators/index.js';
import { LoyaltyService } from './loyalty.service.js';
import {
  AdjustPointsDto,
  CreateRewardDto,
  UpdateRewardDto,
  QueryAccountsDto,
} from './dto/index.js';

@ApiTags('Admin - Loyalty')

@Controller('api/v1/loyalty')
export class AdminLoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  // ─── Accounts ──────────────────────────────────────────────────────────────

  @Get('accounts')
  @ApiOperation({ summary: 'List all loyalty accounts' })
  @ApiResponse({ status: 200, description: 'Paginated loyalty accounts' })
  findAllAccounts(@GetOrg() orgId: string, @Query() query: QueryAccountsDto) {
    return this.loyaltyService.findAllAccounts(orgId, query);
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get a loyalty account with recent transactions' })
  @ApiResponse({ status: 200, description: 'Account details' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  findOneAccount(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.loyaltyService.findOneAccount(orgId, id);
  }

  @Post('accounts/:id/adjust')
  @ApiOperation({ summary: 'Manually adjust points for an account' })
  @ApiResponse({ status: 201, description: 'Points adjusted' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  adjustPoints(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdjustPointsDto,
  ) {
    return this.loyaltyService.adjustPoints(orgId, id, dto);
  }

  // ─── Rewards ───────────────────────────────────────────────────────────────

  @Get('rewards')
  @ApiOperation({ summary: 'List all rewards (including inactive)' })
  @ApiResponse({ status: 200, description: 'All rewards' })
  findAllRewards(@GetOrg() orgId: string) {
    return this.loyaltyService.findAllRewards(orgId);
  }

  @Get('rewards/:id')
  @ApiOperation({ summary: 'Get a single reward' })
  @ApiResponse({ status: 200, description: 'Reward details' })
  @ApiResponse({ status: 404, description: 'Reward not found' })
  findOneReward(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.loyaltyService.findOneReward(orgId, id);
  }

  @Post('rewards')
  @ApiOperation({ summary: 'Create a reward' })
  @ApiResponse({ status: 201, description: 'Reward created' })
  createReward(@GetOrg() orgId: string, @Body() dto: CreateRewardDto) {
    return this.loyaltyService.createReward(orgId, dto);
  }

  @Patch('rewards/:id')
  @ApiOperation({ summary: 'Update a reward' })
  @ApiResponse({ status: 200, description: 'Reward updated' })
  @ApiResponse({ status: 404, description: 'Reward not found' })
  updateReward(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRewardDto,
  ) {
    return this.loyaltyService.updateReward(orgId, id, dto);
  }

  @Delete('rewards/:id')
  @ApiOperation({ summary: 'Delete a reward' })
  @ApiResponse({ status: 200, description: 'Reward deleted' })
  @ApiResponse({ status: 404, description: 'Reward not found' })
  deleteReward(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.loyaltyService.deleteReward(orgId, id);
  }
}
