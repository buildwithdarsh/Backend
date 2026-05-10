import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { CartService } from './cart.service.js';
import { AddCartItemDto, UpdateCartItemDto } from './dto/index.js';

@ApiTags('Storefront Cart')
@UseGuards(EndUserJwtGuard)
@Controller('api/v1/storefront/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user cart (single cart, mixed mode items)' })
  async getCart(@Req() req: RequestWithOrg) {
    return this.cartService.getCart(req.orgId, req.endUser?.id);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add item to cart (variantType per item)' })
  async addItem(
    @Req() req: RequestWithOrg,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(req.orgId, req.endUser?.id, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateItem(
    @Req() req: RequestWithOrg,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(req.orgId, id, dto.quantity);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(
    @Req() req: RequestWithOrg,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.cartService.removeItem(req.orgId, id);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate cart items are still available' })
  async validate(@Req() req: RequestWithOrg) {
    return this.cartService.validate(req.orgId, req.endUser?.id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear entire cart' })
  async clearCart(@Req() req: RequestWithOrg) {
    await this.cartService.clearCart(req.orgId, req.endUser?.id);
  }
}
