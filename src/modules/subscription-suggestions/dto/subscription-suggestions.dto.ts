import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum SuggestionActionDto {
  accepted = 'accepted',
  dismissed = 'dismissed',
  not_interested = 'not_interested',
}

export class SuggestionActionBodyDto {
  @ApiProperty({ enum: SuggestionActionDto })
  @IsEnum(SuggestionActionDto)
  action!: SuggestionActionDto;
}

export class QuerySuggestionsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
