import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({ description: 'Ticket subject' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  subject!: string;

  @ApiProperty({ description: 'Ticket body / description' })
  @IsNotEmpty()
  @IsString()
  body!: string;

  @ApiPropertyOptional({ description: 'Category (e.g., billing, order, general)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({ description: 'Priority: low, normal, high, urgent', default: 'normal' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  priority?: string;

  @ApiPropertyOptional({ description: 'Related commerce order ID' })
  @IsOptional()
  @IsUUID()
  commerceOrderId?: string;
}
