import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryCampaignsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by shop domain' })
  @IsOptional()
  @IsString()
  shopDomain?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED'])
  status?: string;
}

export class QueryLeadsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Filter by redeemed status' })
  @IsOptional()
  @IsIn(['true', 'false'])
  redeemed?: string;
}

export class QueryAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
