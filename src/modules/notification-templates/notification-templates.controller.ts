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
import { NotificationTemplatesService } from './notification-templates.service.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { UpdateTemplateDto } from './dto/update-template.dto.js';
import { PreviewTemplateDto } from './dto/preview-template.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { GetOrg, GetUser } from '../../common/decorators/index.js';

@ApiTags('Notification Templates')
@Controller('api/v1/templates')
export class NotificationTemplatesController {
  constructor(
    private readonly templatesService: NotificationTemplatesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all notification templates (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated template list' })
  findAll(@GetOrg() orgId: string, @Query() dto: PaginationDto) {
    return this.templatesService.findAll(orgId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification template by ID' })
  @ApiResponse({ status: 200, description: 'Template details' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  findOne(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.templatesService.findOne(orgId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new notification template' })
  @ApiResponse({ status: 201, description: 'Template created' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  create(
    @GetOrg() orgId: string,
    @GetUser('id') userId: string,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.templatesService.create(orgId, dto, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a notification template' })
  @ApiResponse({ status: 200, description: 'Template updated' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  update(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a notification template' })
  @ApiResponse({ status: 200, description: 'Template deleted' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  remove(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.templatesService.remove(orgId, id);
  }

  @Post(':id/preview')
  @ApiOperation({ summary: 'Preview a rendered template with sample variables' })
  @ApiResponse({ status: 200, description: 'Rendered template output' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  preview(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PreviewTemplateDto,
  ) {
    return this.templatesService.preview(orgId, id, dto);
  }
}
