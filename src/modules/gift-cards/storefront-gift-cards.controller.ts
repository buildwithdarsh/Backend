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
import { Public } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { GiftCardsService } from './gift-cards.service.js';
import { PurchaseGiftCardDto, RedeemGiftCardDto } from './dto/index.js';

@ApiTags('Storefront - Gift Cards')
@UseGuards(EndUserJwtGuard)
@Controller('api/v1/storefront/gift-cards')
export class StorefrontGiftCardsController {
  constructor(private readonly giftCardsService: GiftCardsService) {}

  @Post('purchase')
  @ApiOperation({ summary: 'Purchase a new gift card' })
  @ApiResponse({ status: 201, description: 'Gift card purchased' })
  purchase(@Req() req: RequestWithOrg, @Body() dto: PurchaseGiftCardDto) {
    return this.giftCardsService.purchase(req.orgId, req.endUser!.id, dto);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem a gift card' })
  @ApiResponse({ status: 201, description: 'Gift card redeemed' })
  @ApiResponse({ status: 400, description: 'Invalid or expired gift card' })
  redeem(@Req() req: RequestWithOrg, @Body() dto: RedeemGiftCardDto) {
    return this.giftCardsService.redeem(
      req.orgId,
      dto.code,
      dto.amount,
      req.endUser!.id,
      dto.commerceOrderId,
    );
  }

  @Public()
  @Get('balance')
  @ApiOperation({ summary: 'Check gift card balance by code' })
  @ApiResponse({ status: 200, description: 'Gift card balance' })
  @ApiResponse({ status: 404, description: 'Gift card not found' })
  checkBalance(@Req() req: RequestWithOrg, @Query('code') code: string) {
    return this.giftCardsService.checkBalance(req.orgId, code);
  }
}
