import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartSessionDto {
  @ApiProperty({ description: 'TMDB movie ID (set from URL param)' })
  @IsInt()
  @IsOptional()
  tmdbId!: number;

  @ApiProperty({ description: 'Movie title for display' })
  @IsString()
  movieTitle!: string;

  @ApiProperty({ description: 'Rate per minute in paise (e.g. 75 = ₹0.75)' })
  @IsInt()
  @Min(1)
  ratePerMinPaise!: number;

  @ApiProperty({ description: 'Maximum charge cap in paise' })
  @IsInt()
  @Min(1)
  meterCapPaise!: number;
}
