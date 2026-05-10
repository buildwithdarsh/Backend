import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiPropertyOptional({ description: 'Catalog item ID being reviewed' })
  @IsOptional()
  @IsUUID()
  catalogItemId?: string;

  @ApiPropertyOptional({ description: 'Commerce order ID associated with the review' })
  @IsOptional()
  @IsUUID()
  commerceOrderId?: string;

  @ApiProperty({ description: 'Rating (1-5)' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ description: 'Review title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Review body text' })
  @IsOptional()
  @IsString()
  body?: string;
}
