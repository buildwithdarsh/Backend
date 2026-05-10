import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePropertyUnitDto {
  @ApiProperty({ description: 'Property type ID' })
  @IsNotEmpty()
  @IsUUID()
  propertyTypeId!: string;

  @ApiProperty({ description: 'Unit number / identifier' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  unitNumber!: string;

  @ApiPropertyOptional({ description: 'Floor number' })
  @IsOptional()
  @IsInt()
  floor?: number;

  @ApiPropertyOptional({ description: 'Status', default: 'available' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
