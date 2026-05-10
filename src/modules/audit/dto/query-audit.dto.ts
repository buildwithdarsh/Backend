import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryAuditDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by actor type (user, api_key, system)',
    example: 'user',
  })
  @IsOptional()
  @IsString()
  actorType?: string;

  @ApiPropertyOptional({
    description: 'Filter by action (e.g. POST /api/v1/users)',
    example: 'POST /api/v1/users',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({
    description: 'Filter by resource type (e.g. users, roles)',
    example: 'users',
  })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({
    description: 'Start date (ISO 8601)',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO 8601)',
    example: '2026-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class QueryAdminAuditDto extends QueryAuditDto {
  @ApiPropertyOptional({
    description: 'Filter by organization ID (super admin only)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  orgId?: string;
}
