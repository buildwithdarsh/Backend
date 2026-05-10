import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export enum PaymentStatusFilter {
  captured = 'captured',
  failed = 'failed',
  refunded = 'refunded',
  partially_refunded = 'partially_refunded',
}

export enum OrderStatusFilter {
  created = 'created',
  attempted = 'attempted',
  paid = 'paid',
  failed = 'failed',
  cancelled = 'cancelled',
}

export enum SubscriptionStatusFilter {
  created = 'created',
  active = 'active',
  paused = 'paused',
  cancelled = 'cancelled',
  expired = 'expired',
  halted = 'halted',
}

export class QueryPaymentsDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: PaymentStatusFilter,
    description: 'Filter by payment status',
  })
  @IsOptional()
  @IsEnum(PaymentStatusFilter)
  status?: PaymentStatusFilter;

  @ApiPropertyOptional({
    description: 'Filter by currency',
    enum: ['INR', 'USD'],
  })
  @IsOptional()
  @IsIn(['INR', 'USD'])
  currency?: string;
}

export class QueryOrdersDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: OrderStatusFilter,
    description: 'Filter by order status',
  })
  @IsOptional()
  @IsEnum(OrderStatusFilter)
  status?: OrderStatusFilter;
}

export class QuerySubscriptionsDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: SubscriptionStatusFilter,
    description: 'Filter by subscription status',
  })
  @IsOptional()
  @IsEnum(SubscriptionStatusFilter)
  status?: SubscriptionStatusFilter;
}
