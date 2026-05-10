import { IsInt, IsOptional, IsPositive, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Product ID (must be a subscription-type product)' })
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional({ description: 'End-user ID (customer)' })
  @IsOptional()
  @IsUUID()
  endUserId?: string;

  @ApiPropertyOptional({ description: 'Existing payment customer ID' })
  @IsOptional()
  @IsUUID()
  paymentCustomerId?: string;

  @ApiPropertyOptional({ description: 'Subscription quantity', default: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  quantity?: number;
}
