import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { NotificationsService } from './notifications.service.js';
import { QueryNotificationsDto } from './dto/query-notifications.dto.js';

@ApiTags('Storefront Notifications')
@Controller('api/v1/storefront/notifications')
@UseGuards(EndUserJwtGuard)
export class StorefrontNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get in-app notifications for the current end user' })
  async getNotifications(
    @Req() req: RequestWithOrg,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const endUserId = req.endUser?.id ?? '';
    const orgId = req.orgId ?? '';
    if (!endUserId || !orgId) {
      return { data: [], total: 0, unreadCount: 0 };
    }
    const dto = new QueryNotificationsDto();
    dto.page = page ? Number(page) : 1;
    dto.limit = limit ? Number(limit) : 20;
    return this.notificationsService.getInApp(orgId, endUserId, dto);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(
    @Param('id') id: string,
    @Req() req: RequestWithOrg,
  ) {
    const orgId = req.orgId ?? '';
    return this.notificationsService.markAsRead(orgId, id, req.endUser?.id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@Req() req: RequestWithOrg) {
    const endUserId = req.endUser?.id ?? '';
    const orgId = req.orgId ?? '';
    return this.notificationsService.markAllAsRead(orgId, endUserId);
  }
}
