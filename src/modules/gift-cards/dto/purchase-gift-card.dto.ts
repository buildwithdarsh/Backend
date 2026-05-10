import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PurchaseGiftCardDto {
  @ApiProperty({ description: 'Gift card amount' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiPropertyOptional({ description: 'Recipient name' })
  @IsOptional()
  @IsString()
  recipientName?: string;

  @ApiPropertyOptional({ description: 'Recipient email' })
  @IsOptional()
  @IsString()
  recipientEmail?: string;

  @ApiPropertyOptional({ description: 'Recipient phone' })
  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @ApiPropertyOptional({ description: 'Personal message' })
  @IsOptional()
  @IsString()
  message?: string;
}
