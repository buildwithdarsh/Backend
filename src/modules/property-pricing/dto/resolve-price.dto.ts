import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResolvePriceDto {
  @ApiProperty({ description: 'Property type ID' })
  @IsNotEmpty()
  @IsUUID()
  propertyTypeId!: string;

  @ApiProperty({ description: 'Check-in date (ISO 8601)' })
  @IsNotEmpty()
  @IsDateString()
  checkInDate!: string;

  @ApiProperty({ description: 'Check-out date (ISO 8601)' })
  @IsNotEmpty()
  @IsDateString()
  checkOutDate!: string;

  @ApiPropertyOptional({ description: 'Number of guests', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  guestCount?: number;
}
