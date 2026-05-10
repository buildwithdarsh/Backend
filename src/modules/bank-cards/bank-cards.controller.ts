import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { BankCardsService } from './bank-cards.service.js';
import type {
  GenerateVirtualCardDto,
  UpdateCardLimitsDto,
  ToggleInternationalDto,
  ToggleCardFeatureDto,
} from './dto/bank-cards.dto.js';

@ApiTags('Storefront - Bank Cards')
@Controller('api/v1/storefront/banking/cards')
@UseGuards(EndUserJwtGuard)
export class BankCardsController {
  constructor(private readonly cardsService: BankCardsService) {}

  @Get()
  @ApiOperation({ summary: 'List all cards for current user' })
  async list(@Req() req: RequestWithOrg) {
    return this.cardsService.list(req.orgId, req.endUser!.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get card details' })
  async getById(@Req() req: RequestWithOrg, @Param('id') id: string) {
    return this.cardsService.getById(req.orgId, req.endUser!.id, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a virtual card instantly' })
  async generateVirtualCard(
    @Req() req: RequestWithOrg,
    @Body() body: GenerateVirtualCardDto,
  ) {
    return this.cardsService.generateVirtualCard(req.orgId, req.endUser!.id, body);
  }

  @Post(':id/block')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block a card' })
  async blockCard(@Req() req: RequestWithOrg, @Param('id') id: string) {
    return this.cardsService.blockCard(req.orgId, req.endUser!.id, id);
  }

  @Post(':id/unblock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unblock a card' })
  async unblockCard(@Req() req: RequestWithOrg, @Param('id') id: string) {
    return this.cardsService.unblockCard(req.orgId, req.endUser!.id, id);
  }

  @Patch(':id/limits')
  @ApiOperation({ summary: 'Update card transaction and ATM limits' })
  async updateLimits(
    @Req() req: RequestWithOrg,
    @Param('id') id: string,
    @Body() body: UpdateCardLimitsDto,
  ) {
    return this.cardsService.updateLimits(req.orgId, req.endUser!.id, id, body);
  }

  @Patch(':id/international')
  @ApiOperation({ summary: 'Enable/disable international usage for travel' })
  async toggleInternational(
    @Req() req: RequestWithOrg,
    @Param('id') id: string,
    @Body() body: ToggleInternationalDto,
  ) {
    return this.cardsService.toggleInternational(
      req.orgId,
      req.endUser!.id,
      id,
      body.enabled,
      body.from,
      body.until,
    );
  }

  @Patch(':id/contactless')
  @ApiOperation({ summary: 'Toggle contactless payment' })
  async toggleContactless(
    @Req() req: RequestWithOrg,
    @Param('id') id: string,
    @Body() body: ToggleCardFeatureDto,
  ) {
    return this.cardsService.toggleContactless(
      req.orgId,
      req.endUser!.id,
      id,
      body.enabled,
    );
  }

  @Patch(':id/online')
  @ApiOperation({ summary: 'Toggle online transactions' })
  async toggleOnline(
    @Req() req: RequestWithOrg,
    @Param('id') id: string,
    @Body() body: ToggleCardFeatureDto,
  ) {
    return this.cardsService.toggleOnline(
      req.orgId,
      req.endUser!.id,
      id,
      body.enabled,
    );
  }
}
