import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty({ description: 'Category this item belongs to' })
  @IsNotEmpty()
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ description: 'URL-friendly slug (unique per org)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  slug!: string;

  @ApiPropertyOptional({ description: 'Diet type (e.g. veg, non-veg, egg)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  dietType?: string;

  @ApiPropertyOptional({ description: 'Whether the item is in stock', default: true })
  @IsOptional()
  @IsBoolean()
  inStock?: boolean;

  @ApiPropertyOptional({ description: 'Sort order within category', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Mark as featured item', default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Mark as new item', default: false })
  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @ApiPropertyOptional({ description: 'List of allergens', default: [] })
  @IsOptional()
  @IsArray()
  allergens?: string[];

  @ApiPropertyOptional({ description: 'Tags for filtering', default: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Tax configuration JSON' })
  @IsOptional()
  @IsObject()
  taxConfig?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Arbitrary metadata JSON' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
