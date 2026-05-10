import {
  Controller,
  Get,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { PromotionsService } from './promotions.service.js';

@ApiTags('Storefront - Promotions')
@Controller('api/v1/storefront/promotions')
export class StorefrontPromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active promotions' })
  @ApiResponse({ status: 200, description: 'Active promotions list' })
  findActive(@Req() req: RequestWithOrg) {
    return this.promotionsService.findActive(req.orgId);
  }
}
