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
import { BankTransfersService } from './bank-transfers.service.js';
import type {
  InitiateTransferDto,
  AddBeneficiaryDto,
  CreateScheduledTransferDto,
  PayBillDto,
} from './dto/bank-transfers.dto.js';

@ApiTags('Storefront - Bank Transfers')
@Controller('api/v1/storefront/banking/transfers')
@UseGuards(EndUserJwtGuard)
export class BankTransfersController {
  constructor(private readonly transfersService: BankTransfersService) {}

  // ─── Fund Transfers ─────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate a fund transfer (NEFT/RTGS/IMPS/UPI)' })
  async initiateTransfer(
    @Req() req: RequestWithOrg,
    @Body() body: InitiateTransferDto,
  ) {
    return this.transfersService.initiateTransfer(req.orgId, req.endUser!.id, body);
  }

  // ─── Beneficiaries ──────────────────────────────────────────────────

  @Post('beneficiaries')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a beneficiary' })
  async addBeneficiary(
    @Req() req: RequestWithOrg,
    @Body() body: AddBeneficiaryDto,
  ) {
    return this.transfersService.addBeneficiary(req.orgId, req.endUser!.id, body);
  }

  @Get('beneficiaries')
  @ApiOperation({ summary: 'List all beneficiaries' })
  async listBeneficiaries(@Req() req: RequestWithOrg) {
    return this.transfersService.listBeneficiaries(req.orgId, req.endUser!.id);
  }

  @Delete('beneficiaries/:id')
  @ApiOperation({ summary: 'Remove a beneficiary' })
  async deleteBeneficiary(
    @Req() req: RequestWithOrg,
    @Param('id') id: string,
  ) {
    return this.transfersService.deleteBeneficiary(req.orgId, req.endUser!.id, id);
  }

  @Patch('beneficiaries/:id/favorite')
  @ApiOperation({ summary: 'Toggle beneficiary favorite status' })
  async toggleFavorite(
    @Req() req: RequestWithOrg,
    @Param('id') id: string,
  ) {
    return this.transfersService.toggleFavorite(req.orgId, req.endUser!.id, id);
  }

  // ─── Scheduled Transfers ────────────────────────────────────────────

  @Post('scheduled')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a scheduled/recurring transfer' })
  async createScheduledTransfer(
    @Req() req: RequestWithOrg,
    @Body() body: CreateScheduledTransferDto,
  ) {
    return this.transfersService.createScheduledTransfer(req.orgId, req.endUser!.id, body);
  }

  @Get('scheduled')
  @ApiOperation({ summary: 'List active scheduled transfers' })
  async listScheduledTransfers(@Req() req: RequestWithOrg) {
    return this.transfersService.listScheduledTransfers(req.orgId, req.endUser!.id);
  }

  @Delete('scheduled/:id')
  @ApiOperation({ summary: 'Cancel a scheduled transfer' })
  async cancelScheduledTransfer(
    @Req() req: RequestWithOrg,
    @Param('id') id: string,
  ) {
    return this.transfersService.cancelScheduledTransfer(req.orgId, req.endUser!.id, id);
  }

  // ─── Bill Payments ──────────────────────────────────────────────────

  @Post('bills')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Pay a bill via BBPS integration' })
  async payBill(
    @Req() req: RequestWithOrg,
    @Body() body: PayBillDto,
  ) {
    return this.transfersService.payBill(req.orgId, req.endUser!.id, body);
  }

  @Get('bills')
  @ApiOperation({ summary: 'List bill payment history' })
  async listBillPayments(
    @Req() req: RequestWithOrg,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('category') category?: string,
  ) {
    return this.transfersService.listBillPayments(
      req.orgId,
      req.endUser!.id,
      page,
      Math.min(limit, 100),
      category,
    );
  }
}
