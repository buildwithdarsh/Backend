import {
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: 'Product or subscription ID to create the order for' })
  @IsString()
  productId!: string;

  @ApiPropertyOptional({ description: 'End-user ID (customer)' })
  @IsOptional()
  @IsUUID()
  endUserId?: string;

  @ApiProperty({
    description: 'Currency code',
    enum: ['INR', 'USD'],
  })
  @IsIn(['INR', 'USD'])
  currency!: string;

  @ApiPropertyOptional({
    description: 'Order amount. Defaults to the product price if not provided.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Arbitrary metadata to attach to this order (e.g. subscriptionId, context).',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
