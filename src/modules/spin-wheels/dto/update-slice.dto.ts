import { IsOptional, IsString, IsNumber, Min, Max, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSliceDto {
  @ApiPropertyOptional({ description: 'Slice label' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ description: 'Hex color' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Text hex color' })
  @IsOptional()
  @IsString()
  textColor?: string;

  @ApiPropertyOptional({ description: 'Prize type' })
  @IsOptional()
  @IsIn(['PERCENTAGE', 'FIXED', 'FREE_SHIPPING', 'NO_PRIZE', 'CUSTOM'])
  prizeType?: string;

  @ApiPropertyOptional({ description: 'Prize value' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  prizeValue?: number;

  @ApiPropertyOptional({ description: 'Probability 0-100' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  probability?: number;

  @ApiPropertyOptional({ description: 'Max redemptions' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRedemptions?: number;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

export class ReorderSlicesDto {
  @ApiPropertyOptional({ description: 'Ordered slice IDs' })
  sliceIds!: string[];
}
