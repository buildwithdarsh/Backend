import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentOrderDto {
  @ApiPropertyOptional({ description: 'Payment type: full, advance, balance', default: 'full' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  paymentType?: string;
}
