import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCouponDto {
  @ApiProperty({ description: 'Coupon code (unique per org)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  code!: string;

  @ApiProperty({ description: 'Coupon display name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Coupon description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Discount type: percentage, fixed, freeDelivery' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  discountType!: string;

  @ApiPropertyOptional({ description: 'Discount value', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({ description: 'Minimum order amount required' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum discount amount cap' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum total usage count' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsageTotal?: number;

  @ApiPropertyOptional({ description: 'Maximum usage per user', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsagePerUser?: number;

  @ApiPropertyOptional({ description: 'Applicable variant types' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableVariantTypes?: string[];

  @ApiPropertyOptional({ description: 'Applicable order types' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableOrderTypes?: string[];

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'Expiry date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Whether the coupon is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
