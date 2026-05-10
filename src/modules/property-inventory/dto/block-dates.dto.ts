import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BlockDatesDto {
  @ApiProperty({ description: 'Property type ID' })
  @IsNotEmpty()
  @IsUUID()
  propertyTypeId!: string;

  @ApiProperty({ description: 'Dates to block (ISO 8601)', type: [String] })
  @IsArray()
  @IsDateString({}, { each: true })
  dates!: string[];

  @ApiPropertyOptional({ description: 'Reason for blocking' })
  @IsOptional()
  @IsString()
  reason?: string;
}
