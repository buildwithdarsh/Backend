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
import { PromotionsService } from './promotions.service.js';
import { CreatePromotionDto, UpdatePromotionDto, QueryPromotionsDto } from './dto/index.js';

@ApiTags('Admin - Promotions')

@Controller('api/v1/promotions')
export class AdminPromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all promotions with filters & pagination' })
  @ApiResponse({ status: 200, description: 'Paginated promotions list' })
  findAll(@GetOrg() orgId: string, @Query() query: QueryPromotionsDto) {
    return this.promotionsService.findAll(orgId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single promotion' })
  @ApiResponse({ status: 200, description: 'Promotion details' })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  findOne(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.promotionsService.findOne(orgId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new promotion' })
  @ApiResponse({ status: 201, description: 'Promotion created' })
  create(@GetOrg() orgId: string, @Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(orgId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a promotion' })
  @ApiResponse({ status: 200, description: 'Promotion updated' })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  update(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.promotionsService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a promotion' })
  @ApiResponse({ status: 200, description: 'Promotion deleted' })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  remove(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.promotionsService.remove(orgId, id);
  }
}
