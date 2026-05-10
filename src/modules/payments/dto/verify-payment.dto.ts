import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Internal order ID' })
  @IsUUID()
  orderId!: string;

  @ApiPropertyOptional({ description: 'Razorpay payment ID (razorpay only)' })
  @IsOptional()
  @IsString()
  razorpayPaymentId?: string;

  @ApiPropertyOptional({ description: 'Razorpay signature (razorpay only)' })
  @IsOptional()
  @IsString()
  razorpaySignature?: string;

  @ApiPropertyOptional({
    description: 'Stripe payment intent ID (stripe only)',
  })
  @IsOptional()
  @IsString()
  stripePaymentIntentId?: string;
}
