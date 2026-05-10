import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHoldDto {
  @ApiProperty({ description: 'Property type ID' })
  @IsNotEmpty()
  @IsUUID()
  propertyTypeId!: string;

  @ApiProperty({ description: 'Start date (ISO 8601)' })
  @IsNotEmpty()
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'End date (ISO 8601)' })
  @IsNotEmpty()
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ description: 'Number of units to hold', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  units?: number;
}
