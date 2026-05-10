import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  variantType!: string;

  @ApiProperty({ enum: ['delivery', 'pickup', 'dine_in'] })
  @IsIn(['delivery', 'pickup', 'dine_in'])
  orderType!: string;

  @ApiProperty({ enum: ['online', 'cod', 'wallet'] })
  @IsIn(['online', 'cod', 'wallet'])
  paymentMethod!: string;

  @ApiPropertyOptional({
    enum: ['upi', 'card', 'netbanking', 'emi'],
    description: 'Sub-method for online payments',
  })
  @IsOptional()
  @IsIn(['upi', 'card', 'netbanking', 'emi'])
  paymentSubMethod?: string;

  @ApiPropertyOptional({ description: 'Whether this is a partial payment' })
  @IsOptional()
  @IsBoolean()
  partialPayment?: boolean;

  @ApiPropertyOptional({ description: 'Required for delivery orders' })
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty()
  @IsString()
  customerName!: string;

  @ApiProperty()
  @IsString()
  customerPhone!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  loyaltyPointsToRedeem?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @ApiPropertyOptional({ default: 'web' })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  contactless?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Whether to gift wrap the order' })
  @IsOptional()
  @IsBoolean()
  giftWrap?: boolean;
}
