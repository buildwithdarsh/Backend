import {
  Controller,
  Get,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { ContentService } from './content.service.js';
import { QueryContentDto } from './dto/index.js';

@ApiTags('Storefront - Content')
@Controller('api/v1/storefront/content')
export class StorefrontContentController {
  constructor(private readonly contentService: ContentService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published content posts' })
  @ApiResponse({ status: 200, description: 'Paginated published posts' })
  findPublished(@Req() req: RequestWithOrg, @Query() query: QueryContentDto) {
    return this.contentService.findPublished(req.orgId, query);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a published content post by slug' })
  @ApiResponse({ status: 200, description: 'Content post details' })
  @ApiResponse({ status: 404, description: 'Content post not found' })
  findBySlug(@Req() req: RequestWithOrg, @Param('slug') slug: string) {
    return this.contentService.findBySlug(req.orgId, slug);
  }
}
