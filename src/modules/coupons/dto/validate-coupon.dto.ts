import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty({ description: 'Coupon code to validate' })
  @IsNotEmpty()
  @IsString()
  code!: string;

  @ApiProperty({ description: 'Current order amount' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  orderAmount!: number;

  @ApiPropertyOptional({ description: 'Variant type of the order' })
  @IsOptional()
  @IsString()
  variantType?: string;

  @ApiPropertyOptional({ description: 'Order type (delivery, pickup, dineIn)' })
  @IsOptional()
  @IsString()
  orderType?: string;

  @ApiPropertyOptional({ description: 'Room/property type ID for property-specific coupons' })
  @IsOptional()
  @IsUUID()
  roomTypeId?: string;
}
