import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ description: 'TMDB movie ID' })
  @IsInt()
  tmdbId!: number;

  @ApiProperty({ description: 'Movie title for display' })
  @IsString()
  movieTitle!: string;

  @ApiPropertyOptional({ description: 'Movie poster URL' })
  @IsOptional()
  @IsString()
  posterUrl?: string;

  @ApiProperty({ description: 'Google Drive file ID for the movie' })
  @IsString()
  gdriveFileId!: string;

  @ApiProperty({ description: 'Room name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Room privacy', enum: ['public', 'private'], default: 'public' })
  @IsOptional()
  @IsEnum(['public', 'private'] as const)
  privacy?: 'public' | 'private';

  @ApiPropertyOptional({ description: 'Room vibe', enum: ['chill', 'serious', 'party', 'commentary'], default: 'chill' })
  @IsOptional()
  @IsEnum(['chill', 'serious', 'party', 'commentary'] as const)
  vibe?: 'chill' | 'serious' | 'party' | 'commentary';

  @ApiProperty({ description: 'Rate per minute in paise (e.g. 75 = ₹0.75)' })
  @IsInt()
  @Min(1)
  ratePerMinPaise!: number;

  @ApiPropertyOptional({ description: 'Maximum number of viewers', default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxViewers?: number;
}
