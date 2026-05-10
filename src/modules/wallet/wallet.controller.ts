import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/index.js';
import { GetOrg } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { PrismaService } from '../../database/prisma.service.js';
import { WalletService } from './wallet.service.js';

interface WalletPack {
  name: string;
  amount: number;
  bonus: number;
  desc: string;
  popular?: boolean;
}

// Default packs — used if no OrgSettings override exists
const DEFAULT_PACKS: WalletPack[] = [
  { name: 'Quick Try', amount: 10, bonus: 0, desc: 'Watch ~20 min of Standard content' },
  { name: 'Starter Pack', amount: 20, bonus: 0, desc: 'Try it out — ~40 min of Standard content' },
  { name: 'Movie Night', amount: 50, bonus: 5, desc: 'Enough for one Premium film', popular: true },
  { name: 'Weekend Pack', amount: 100, bonus: 15, desc: '2–3 movies over a weekend' },
  { name: 'Cinephile Pack', amount: 200, bonus: 40, desc: '4–6 movies, best value' },
  { name: 'Super Fan', amount: 500, bonus: 125, desc: '10–15 movies, family use' },
];

@ApiTags('Storefront - Wallet')
@Controller('api/v1/storefront/wallet')
export class WalletController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Public Endpoint ──────────────────────────────────────────────────

  @Get('packs')
  @Public()
  @ApiOperation({ summary: 'Get wallet top-up packs (public — pricing is not secret)' })
  async getPacks(@GetOrg() orgId: string) {
    // Try to load custom packs from OrgSettings
    const setting = await this.prisma.orgSettings.findFirst({
      where: { orgId, group: 'wallet', key: 'packs' },
    });

    if (setting?.value) {
      try {
        const packs = JSON.parse(setting.value) as WalletPack[];
        if (Array.isArray(packs) && packs.length > 0) {
          return { packs };
        }
      } catch {
        // Invalid JSON — fall through to defaults
      }
    }

    return { packs: DEFAULT_PACKS };
  }

  // ─── ENDUSER Protected Endpoints ──────────────────────────────────────

  @Get('balance')
  @UseGuards(EndUserJwtGuard)
  @ApiOperation({ summary: 'Get current wallet balance' })
  async getBalance(@Req() req: RequestWithOrg) {
    const balancePaise = await this.walletService.getBalance(
      req.orgId,
      req.endUser!.id,
    );
    return { balancePaise };
  }

  @Post('topup')
  @UseGuards(EndUserJwtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Top up wallet after Razorpay payment verification' })
  async topUp(
    @Req() req: RequestWithOrg,
    @Body()
    body: {
      razorpayPaymentId: string;
      razorpayOrderId: string;
      razorpaySignature: string;
      amountPaise: number;
      bonusPaise?: number;
    },
  ) {
    const {
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      amountPaise,
      bonusPaise,
    } = body;

    // Verify Razorpay signature
    const secret = this.configService.getOrThrow<string>('RAZORPAY_KEY_SECRET');
    const expectedSignature = createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new HttpException(
        'Invalid payment signature',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Credit the main amount
    const totalCredit = amountPaise + (bonusPaise ?? 0);
    const description =
      bonusPaise && bonusPaise > 0
        ? `Top-up ₹${(amountPaise / 100).toFixed(2)} + bonus ₹${(bonusPaise / 100).toFixed(2)}`
        : `Top-up ₹${(amountPaise / 100).toFixed(2)}`;

    const balancePaise = await this.walletService.topUp(
      req.orgId,
      req.endUser!.id,
      totalCredit,
      description,
      razorpayPaymentId,
    );

    return { balancePaise };
  }

  @Get('transactions')
  @UseGuards(EndUserJwtGuard)
  @ApiOperation({ summary: 'Get paginated wallet transaction history' })
  async getTransactions(
    @Req() req: RequestWithOrg,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.walletService.getTransactions(
      req.orgId,
      req.endUser!.id,
      page,
      Math.min(limit, 100),
    );
  }
}
