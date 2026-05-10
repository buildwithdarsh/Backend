import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StorefrontAvailabilityDto {
  @ApiPropertyOptional({ description: 'Property type ID (omit for all types)' })
  @IsOptional()
  @IsUUID()
  propertyTypeId?: string;

  @ApiProperty({ description: 'Start date (ISO 8601)' })
  @IsNotEmpty()
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'End date (ISO 8601)' })
  @IsNotEmpty()
  @IsDateString()
  endDate!: string;
}
