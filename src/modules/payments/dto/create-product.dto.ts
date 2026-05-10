import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Product type',
    enum: ['one_time', 'subscription'],
  })
  @IsIn(['one_time', 'subscription'])
  type!: 'one_time' | 'subscription';

  @ApiPropertyOptional({ description: 'Price in INR' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  priceInr?: number;

  @ApiPropertyOptional({ description: 'Price in USD' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  priceUsd?: number;

  @ApiProperty({ description: 'Default currency', enum: ['INR', 'USD'] })
  @IsIn(['INR', 'USD'])
  currency!: string;

  @ApiPropertyOptional({
    description: 'Razorpay plan ID (for subscription products)',
  })
  @IsOptional()
  @IsString()
  razorpayPlanId?: string;

  @ApiPropertyOptional({
    description: 'Stripe price ID (for subscription products)',
  })
  @IsOptional()
  @IsString()
  stripePriceId?: string;
}
