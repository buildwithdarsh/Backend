import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export enum CampaignStatusFilter {
  draft = 'draft',
  scheduled = 'scheduled',
  running = 'running',
  paused = 'paused',
  completed = 'completed',
  failed = 'failed',
}

export enum CampaignChannelFilter {
  email = 'email',
  sms = 'sms',
  push = 'push',
  whatsapp = 'whatsapp',
  multi = 'multi',
}

export class QueryCampaignsDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: CampaignStatusFilter,
    description: 'Filter by campaign status',
  })
  @IsOptional()
  @IsEnum(CampaignStatusFilter)
  status?: CampaignStatusFilter;

  @ApiPropertyOptional({
    enum: CampaignChannelFilter,
    description: 'Filter by campaign channel',
  })
  @IsOptional()
  @IsEnum(CampaignChannelFilter)
  channel?: CampaignChannelFilter;
}
