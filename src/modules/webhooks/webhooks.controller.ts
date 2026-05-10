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
import { WebhooksService } from './webhooks.service.js';
import { CreateWebhookDto } from './dto/create-webhook.dto.js';
import { UpdateWebhookDto } from './dto/update-webhook.dto.js';
import { QueryWebhookLogsDto } from './dto/query-webhook-logs.dto.js';
import { GetOrg, GetUser } from '../../common/decorators/index.js';

@ApiTags('Webhooks')
@Controller('api/v1/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  @ApiOperation({ summary: 'List all webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook list' })
  findAll(@GetOrg() orgId: string) {
    return this.webhooksService.findAll(orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new webhook' })
  @ApiResponse({
    status: 201,
    description: 'Webhook created (returns signing secret once)',
  })
  create(
    @GetOrg() orgId: string,
    @GetUser('id') userId: string,
    @Body() dto: CreateWebhookDto,
  ) {
    return this.webhooksService.create(orgId, dto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a webhook by ID' })
  @ApiResponse({ status: 200, description: 'Webhook details' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  findOne(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.webhooksService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a webhook' })
  @ApiResponse({ status: 200, description: 'Webhook updated' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  update(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.webhooksService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a webhook' })
  @ApiResponse({ status: 200, description: 'Webhook deleted' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  remove(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.webhooksService.remove(orgId, id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Send a test event to a webhook' })
  @ApiResponse({ status: 200, description: 'Test event queued' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  test(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.webhooksService.test(orgId, id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get paginated delivery logs for a webhook' })
  @ApiResponse({ status: 200, description: 'Paginated webhook delivery logs' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  getLogs(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() dto: QueryWebhookLogsDto,
  ) {
    return this.webhooksService.getLogs(orgId, id, dto);
  }

  @Post(':id/retry/:logId')
  @ApiOperation({ summary: 'Retry a failed webhook delivery' })
  @ApiResponse({ status: 200, description: 'Webhook delivery retry queued' })
  @ApiResponse({ status: 404, description: 'Webhook or log not found' })
  retryLog(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('logId', ParseUUIDPipe) logId: string,
  ) {
    return this.webhooksService.retryLog(orgId, id, logId);
  }
}
