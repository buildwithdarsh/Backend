import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePricingRuleDto {
  @ApiPropertyOptional({ description: 'Property type ID (null for org-wide)' })
  @IsOptional()
  @IsUUID()
  propertyTypeId?: string;

  @ApiProperty({ description: 'Rule name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'Rule type: base, weekend, seasonal, festival, discount' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  type!: string;

  @ApiPropertyOptional({ description: 'Override price in smallest unit' })
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Multiplier (e.g. 1.20 for 20% increase)' })
  @IsOptional()
  @IsNumber()
  multiplier?: number;

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Days of week (0=Sun..6=Sat)', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  daysOfWeek?: number[];

  @ApiPropertyOptional({ description: 'Minimum stay nights' })
  @IsOptional()
  @IsInt()
  @Min(1)
  minStay?: number;

  @ApiPropertyOptional({ description: 'Maximum stay nights' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxStay?: number;

  @ApiPropertyOptional({ description: 'Priority (higher = more important)', default: 0 })
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
