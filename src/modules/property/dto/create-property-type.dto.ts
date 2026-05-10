import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePropertyTypeDto {
  @ApiProperty({ description: 'Property type name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'URL-friendly slug' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  slug!: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Base price in smallest currency unit (paise)', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({ description: 'Maximum guests', default: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxGuests?: number;

  @ApiPropertyOptional({ description: 'Bed type' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bedType?: string;

  @ApiPropertyOptional({ description: 'Unit size' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unitSize?: string;

  @ApiPropertyOptional({ description: 'Image URLs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Status', default: 'active' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}
