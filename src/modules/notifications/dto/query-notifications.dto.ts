import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export enum NotificationTypeFilter {
  in_app = 'in_app',
  email = 'email',
  sms = 'sms',
  push = 'push',
  whatsapp = 'whatsapp',
}

export enum NotificationStatusFilter {
  pending = 'pending',
  sent = 'sent',
  delivered = 'delivered',
  failed = 'failed',
  read = 'read',
}

export class QueryNotificationsDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: NotificationTypeFilter,
    description: 'Filter by notification type',
  })
  @IsOptional()
  @IsEnum(NotificationTypeFilter)
  type?: NotificationTypeFilter;

  @ApiPropertyOptional({
    enum: NotificationStatusFilter,
    description: 'Filter by notification status',
  })
  @IsOptional()
  @IsEnum(NotificationStatusFilter)
  status?: NotificationStatusFilter;
}
