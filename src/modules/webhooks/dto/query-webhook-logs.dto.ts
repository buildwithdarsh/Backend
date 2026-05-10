import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export enum WebhookLogStatusFilter {
  pending = 'pending',
  success = 'success',
  failed = 'failed',
  exhausted = 'exhausted',
}

export class QueryWebhookLogsDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: WebhookLogStatusFilter,
    description: 'Filter by webhook log status',
  })
  @IsOptional()
  @IsEnum(WebhookLogStatusFilter)
  status?: WebhookLogStatusFilter;
}
