import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto, QueryReviewsDto } from './dto/index.js';

@ApiTags('Storefront - Reviews')
@UseGuards(EndUserJwtGuard)
@Controller('api/v1/storefront/reviews')
export class StorefrontReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List approved reviews (optionally filter by item)' })
  @ApiResponse({ status: 200, description: 'Paginated approved reviews' })
  findAll(@Req() req: RequestWithOrg, @Query() query: QueryReviewsDto) {
    if (query.catalogItemId) {
      return this.reviewsService.findByItem(req.orgId, query.catalogItemId, query);
    }
    // For storefront, only return approved reviews
    query.status = 'approved';
    return this.reviewsService.findAll(req.orgId, query);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get reviews submitted by the current user' })
  @ApiResponse({ status: 200, description: 'User reviews list' })
  getMyReviews(@Req() req: RequestWithOrg) {
    return this.reviewsService.getMyReviews(req.orgId, req.endUser?.id ?? '');
  }

  @Post()
  @ApiOperation({ summary: 'Submit a new review' })
  @ApiResponse({ status: 201, description: 'Review submitted (pending moderation)' })
  create(@Req() req: RequestWithOrg, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.orgId, req.endUser!.id, dto);
  }

  @Post(':id/helpful')
  @ApiOperation({ summary: 'Toggle helpful vote on a review' })
  @ApiResponse({ status: 201, description: 'Vote toggled' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  voteHelpful(
    @Req() req: RequestWithOrg,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reviewsService.voteHelpful(req.orgId, id, req.endUser!.id);
  }
}
