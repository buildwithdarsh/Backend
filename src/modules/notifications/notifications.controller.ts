import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service.js';
import { SendNotificationDto } from './dto/send-notification.dto.js';
import { SendBulkNotificationDto } from './dto/send-bulk-notification.dto.js';
import { QueryNotificationsDto } from './dto/query-notifications.dto.js';
import { GetOrg } from '../../common/decorators/index.js';

@ApiTags('Notifications')
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all notifications (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated notification list' })
  findAll(@GetOrg() orgId: string, @Query() dto: QueryNotificationsDto) {
    return this.notificationsService.findAll(orgId, dto);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a single notification' })
  @ApiResponse({ status: 201, description: 'Notification queued for delivery' })
  send(@GetOrg() orgId: string, @Body() dto: SendNotificationDto) {
    return this.notificationsService.send(orgId, dto);
  }

  @Post('send-bulk')
  @ApiOperation({ summary: 'Send bulk notifications' })
  @ApiResponse({ status: 201, description: 'Notifications queued for delivery' })
  sendBulk(@GetOrg() orgId: string, @Body() dto: SendBulkNotificationDto) {
    return this.notificationsService.sendBulk(orgId, dto);
  }

  @Get('in-app')
  @ApiOperation({ summary: 'List in-app notifications for an end user' })
  @ApiQuery({ name: 'endUserId', type: String, description: 'End user UUID' })
  @ApiResponse({ status: 200, description: 'Paginated in-app notification list' })
  getInApp(
    @GetOrg() orgId: string,
    @Query('endUserId', ParseUUIDPipe) endUserId: string,
    @Query() dto: QueryNotificationsDto,
  ) {
    return this.notificationsService.getInApp(orgId, endUserId, dto);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread in-app notification count for an end user' })
  @ApiQuery({ name: 'endUserId', type: String, description: 'End user UUID' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  getUnreadCount(
    @GetOrg() orgId: string,
    @Query('endUserId', ParseUUIDPipe) endUserId: string,
  ) {
    return this.notificationsService.getUnreadCount(orgId, endUserId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification status by ID' })
  @ApiResponse({ status: 200, description: 'Notification details' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  findOne(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationsService.findOne(orgId, id);
  }

  @Post(':id/resend')
  @ApiOperation({ summary: 'Retry a failed notification' })
  @ApiResponse({ status: 200, description: 'Notification re-queued' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  resend(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationsService.resend(orgId, id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  markAsRead(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationsService.markAsRead(orgId, id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all in-app notifications as read for an end user' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  markAllAsRead(
    @GetOrg() orgId: string,
    @Body('endUserId', ParseUUIDPipe) endUserId: string,
  ) {
    return this.notificationsService.markAllAsRead(orgId, endUserId);
  }
}
