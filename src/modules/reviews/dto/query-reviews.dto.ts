import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryReviewsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by catalog item ID' })
  @IsOptional()
  @IsUUID()
  catalogItemId?: string;

  @ApiPropertyOptional({ description: 'Filter by status (pending, approved, rejected)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum rating' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(5)
  minRating?: number;
}
