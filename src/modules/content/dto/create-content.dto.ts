import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Prisma } from '@prisma/client';

export class CreateContentDto {
  @ApiProperty({ description: 'Post title' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ description: 'URL-friendly slug (unique per org)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  slug!: string;

  @ApiProperty({ description: 'Post body (HTML or markdown)' })
  @IsNotEmpty()
  @IsString()
  body!: string;

  @ApiPropertyOptional({ description: 'Short excerpt' })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional({ description: 'Featured image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Content category' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({ description: 'Tags array' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Status: draft, published, archived', default: 'draft' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @ApiPropertyOptional({ description: 'Author user ID' })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON' })
  @IsOptional()
  metadata?: Prisma.InputJsonValue;
}
