import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export enum OrgStatusFilter {
  active = 'active',
  suspended = 'suspended',
  trial = 'trial',
  cancelled = 'cancelled',
}

export class QueryOrganizationDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: OrgStatusFilter,
    description: 'Filter by organization status',
  })
  @IsOptional()
  @IsEnum(OrgStatusFilter)
  status?: OrgStatusFilter;
}
