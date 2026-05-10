import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsArray,
  Min,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMovieDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  originalTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  synopsis?: string;

  @ApiProperty()
  @IsInt()
  releaseYear!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @ApiProperty()
  @IsString()
  contentRating!: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  languages!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subtitles?: string[];

  @ApiProperty()
  @IsString()
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  posterUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  backdropUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trailerUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  streamUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rentPriceInr?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  buyPriceInr?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  rentalHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  rentalMaxPlays?: number;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  genres!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  moods?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  credits?: Array<{
    personName: string;
    personSlug: string;
    role: string;
    character?: string;
    photoUrl?: string;
    sortOrder?: number;
  }>;
}
