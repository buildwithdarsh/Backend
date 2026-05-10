import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetOrg } from '../../common/decorators/index.js';
import { GiftCardsService } from './gift-cards.service.js';
import { CreateGiftCardDto, QueryGiftCardsDto } from './dto/index.js';

@ApiTags('Admin - Gift Cards')

@Controller('api/v1/gift-cards')
export class AdminGiftCardsController {
  constructor(private readonly giftCardsService: GiftCardsService) {}

  @Get()
  @ApiOperation({ summary: 'List all gift cards with filters & pagination' })
  @ApiResponse({ status: 200, description: 'Paginated gift cards list' })
  findAll(@GetOrg() orgId: string, @Query() query: QueryGiftCardsDto) {
    return this.giftCardsService.findAll(orgId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single gift card with transactions' })
  @ApiResponse({ status: 200, description: 'Gift card details' })
  @ApiResponse({ status: 404, description: 'Gift card not found' })
  findOne(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.giftCardsService.findOne(orgId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new gift card' })
  @ApiResponse({ status: 201, description: 'Gift card created' })
  create(@GetOrg() orgId: string, @Body() dto: CreateGiftCardDto) {
    return this.giftCardsService.create(orgId, dto);
  }
}
