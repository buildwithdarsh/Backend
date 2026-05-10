import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetOrg } from '../../common/decorators/index.js';
import { ReviewsService } from './reviews.service.js';
import { QueryReviewsDto, UpdateReviewStatusDto } from './dto/index.js';

@ApiTags('Admin - Reviews')

@Controller('api/v1/reviews')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'List all reviews with filters & pagination' })
  @ApiResponse({ status: 200, description: 'Paginated reviews list' })
  findAll(@GetOrg() orgId: string, @Query() query: QueryReviewsDto) {
    return this.reviewsService.findAll(orgId, query);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Approve or reject a review' })
  @ApiResponse({ status: 200, description: 'Review status updated' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  updateStatus(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewStatusDto,
  ) {
    return this.reviewsService.updateStatus(orgId, id, dto.status);
  }
}
