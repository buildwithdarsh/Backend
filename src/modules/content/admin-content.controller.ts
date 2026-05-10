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
import { ContentService } from './content.service.js';
import { CreateContentDto, UpdateContentDto, QueryContentDto } from './dto/index.js';

@ApiTags('Admin - Content')

@Controller('api/v1/content')
export class AdminContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @ApiOperation({ summary: 'List all content posts with filters & pagination' })
  @ApiResponse({ status: 200, description: 'Paginated content posts' })
  findAll(@GetOrg() orgId: string, @Query() query: QueryContentDto) {
    return this.contentService.findAll(orgId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single content post' })
  @ApiResponse({ status: 200, description: 'Content post details' })
  @ApiResponse({ status: 404, description: 'Content post not found' })
  findOne(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.contentService.findOne(orgId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new content post' })
  @ApiResponse({ status: 201, description: 'Content post created' })
  create(@GetOrg() orgId: string, @Body() dto: CreateContentDto) {
    return this.contentService.create(orgId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a content post' })
  @ApiResponse({ status: 200, description: 'Content post updated' })
  @ApiResponse({ status: 404, description: 'Content post not found' })
  update(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContentDto,
  ) {
    return this.contentService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a content post' })
  @ApiResponse({ status: 200, description: 'Content post deleted' })
  @ApiResponse({ status: 404, description: 'Content post not found' })
  remove(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.contentService.remove(orgId, id);
  }
}
