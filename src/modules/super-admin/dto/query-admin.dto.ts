import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryAdminDto extends PaginationDto {}

export class QueryAdminInvoicesDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter invoices by organization ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  orgId?: string;
}
