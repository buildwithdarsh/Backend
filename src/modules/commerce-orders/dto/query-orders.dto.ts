import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryOrdersDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by order status',
    enum: [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'picked_up',
      'completed',
      'cancelled',
      'refunded',
    ],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by order type',
    enum: ['delivery', 'pickup', 'dine_in'],
  })
  @IsOptional()
  @IsIn(['delivery', 'pickup', 'dine_in'])
  orderType?: string;

  @ApiPropertyOptional({ description: 'Filter orders from this date (ISO string)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter orders until this date (ISO string)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
