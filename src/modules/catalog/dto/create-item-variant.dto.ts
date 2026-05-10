import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItemVariantDto {
  @ApiProperty({ description: 'Variant type (e.g. classic, premium)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  variantType!: string;

  @ApiProperty({ description: 'Variant display name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'Variant price' })
  @IsNotEmpty()
  @IsNumber()
  price!: number;

  @ApiPropertyOptional({ description: 'Variant description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Variant image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Nutrition data JSON' })
  @IsOptional()
  @IsObject()
  nutritionData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Whether the variant is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
