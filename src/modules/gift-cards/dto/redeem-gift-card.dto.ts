import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RedeemGiftCardDto {
  @ApiProperty({ description: 'Gift card code' })
  @IsNotEmpty()
  @IsString()
  code!: string;

  @ApiProperty({ description: 'Amount to redeem' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ description: 'Commerce order ID for the redemption' })
  @IsOptional()
  @IsUUID()
  commerceOrderId?: string;
}
