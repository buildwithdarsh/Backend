import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Booking ID' })
  @IsNotEmpty()
  @IsUUID()
  bookingId!: string;

  @ApiProperty({ description: 'Provider order ID' })
  @IsNotEmpty()
  @IsString()
  providerOrderId!: string;

  @ApiProperty({ description: 'Provider payment ID' })
  @IsNotEmpty()
  @IsString()
  providerPaymentId!: string;

  @ApiPropertyOptional({ description: 'Provider signature' })
  @IsOptional()
  @IsString()
  providerSignature?: string;
}
