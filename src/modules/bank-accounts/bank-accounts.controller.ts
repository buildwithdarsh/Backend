import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { BankAccountsService } from './bank-accounts.service.js';
import type {
  UpdateAccountNicknameDto,
  SetAutoSweepDto,
  CreateFixedDepositDto,
} from './dto/bank-accounts.dto.js';

@ApiTags('Storefront - Bank Accounts')
@Controller('api/v1/storefront/banking/accounts')
@UseGuards(EndUserJwtGuard)
export class BankAccountsController {
  constructor(private readonly accountsService: BankAccountsService) {}

  @Get()
  @ApiOperation({ summary: 'List all accounts for current user' })
  async list(@Req() req: RequestWithOrg) {
    return this.accountsService.list(req.orgId, req.endUser!.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account details' })
  async getById(@Req() req: RequestWithOrg, @Param('id') id: string) {
    return this.accountsService.getById(req.orgId, req.endUser!.id, id);
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Get real-time account balance' })
  async getBalance(@Req() req: RequestWithOrg, @Param('id') id: string) {
    return this.accountsService.getBalance(req.orgId, req.endUser!.id, id);
  }

  @Patch(':id/nickname')
  @ApiOperation({ summary: 'Set custom account nickname' })
  async updateNickname(
    @Req() req: RequestWithOrg,
    @Param('id') id: string,
    @Body() body: UpdateAccountNicknameDto,
  ) {
    return this.accountsService.updateNickname(
      req.orgId,
      req.endUser!.id,
      id,
      body.nickname,
    );
  }

  @Patch(':id/auto-sweep')
  @ApiOperation({ summary: 'Configure auto-sweep facility' })
  async setAutoSweep(
    @Req() req: RequestWithOrg,
    @Param('id') id: string,
    @Body() body: SetAutoSweepDto,
  ) {
    return this.accountsService.setAutoSweep(
      req.orgId,
      req.endUser!.id,
      id,
      body.enabled,
      body.threshold,
    );
  }

  @Get(':id/statement')
  @ApiOperation({ summary: 'Get account statement with pagination' })
  async getStatement(
    @Req() req: RequestWithOrg,
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accountsService.getStatement(
      req.orgId,
      req.endUser!.id,
      id,
      page,
      Math.min(limit, 100),
      startDate,
      endDate,
    );
  }

  // ─── Fixed Deposits ─────────────────────────────────────────────────

  @Get('fixed-deposits/list')
  @ApiOperation({ summary: 'List all fixed deposits' })
  async listFixedDeposits(@Req() req: RequestWithOrg) {
    return this.accountsService.listFixedDeposits(req.orgId, req.endUser!.id);
  }

  @Post('fixed-deposits')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a fixed deposit' })
  async createFixedDeposit(
    @Req() req: RequestWithOrg,
    @Body() body: CreateFixedDepositDto,
  ) {
    return this.accountsService.createFixedDeposit(
      req.orgId,
      req.endUser!.id,
      body,
    );
  }

  @Delete('fixed-deposits/:fdId')
  @ApiOperation({ summary: 'Premature closure of fixed deposit' })
  async closeFixedDeposit(
    @Req() req: RequestWithOrg,
    @Param('fdId') fdId: string,
  ) {
    return this.accountsService.closeFixedDeposit(
      req.orgId,
      req.endUser!.id,
      fdId,
    );
  }
}
