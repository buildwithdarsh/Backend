import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export enum InvoiceStatusFilter {
  draft = 'draft',
  sent = 'sent',
  paid = 'paid',
  overdue = 'overdue',
  cancelled = 'cancelled',
}

export class QueryInvoicesDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: InvoiceStatusFilter,
    description: 'Filter invoices by status',
  })
  @IsOptional()
  @IsEnum(InvoiceStatusFilter)
  status?: InvoiceStatusFilter;
}
