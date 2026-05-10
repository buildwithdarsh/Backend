import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentLinkDto {
  @ApiProperty({ description: 'Payment link display name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Description for the payment link' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Amount to charge' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @ApiProperty({ description: 'Currency code', enum: ['INR', 'USD'] })
  @IsIn(['INR', 'USD'])
  currency!: string;

  @ApiProperty({
    description: 'Link type',
    enum: ['one_time', 'subscription'],
  })
  @IsIn(['one_time', 'subscription'])
  type!: 'one_time' | 'subscription';

  @ApiPropertyOptional({ description: 'Associated product ID' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ description: 'Expiry date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Maximum number of uses' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  maxUses?: number;

  @ApiPropertyOptional({ description: 'Redirect URL after successful payment' })
  @IsOptional()
  @IsUrl()
  successUrl?: string;

  @ApiPropertyOptional({
    description: 'Redirect URL if payment is cancelled',
  })
  @IsOptional()
  @IsUrl()
  cancelUrl?: string;
}
