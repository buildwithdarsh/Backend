import {
  IsNotEmpty, IsOptional, IsString, IsBoolean, IsArray,
  ValidateNested, IsNumber, Min, Max, IsIn, IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSliceDto {
  @ApiProperty({ description: 'Slice display label', example: '20% OFF' })
  @IsNotEmpty()
  @IsString()
  label!: string;

  @ApiProperty({ description: 'Hex color', example: '#FF6B6B' })
  @IsNotEmpty()
  @IsString()
  color!: string;

  @ApiPropertyOptional({ description: 'Text hex color', example: '#FFFFFF' })
  @IsOptional()
  @IsString()
  textColor?: string;

  @ApiProperty({ description: 'Prize type', example: 'PERCENTAGE' })
  @IsNotEmpty()
  @IsIn(['PERCENTAGE', 'FIXED', 'FREE_SHIPPING', 'NO_PRIZE', 'CUSTOM'])
  prizeType!: string;

  @ApiPropertyOptional({ description: 'Prize value (discount amount)', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  prizeValue?: number;

  @ApiProperty({ description: 'Win probability 0-100', example: 25 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  probability!: number;

  @ApiPropertyOptional({ description: 'Max times this prize can be won' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRedemptions?: number;

  @ApiProperty({ description: 'Sort order on wheel', example: 0 })
  @IsNumber()
  @Min(0)
  sortOrder!: number;
}

export class CreateCampaignDto {
  @ApiProperty({ description: 'Shopify shop domain', example: 'my-store.myshopify.com' })
  @IsNotEmpty()
  @IsString()
  shopDomain!: string;

  @ApiProperty({ description: 'Campaign name', example: 'Summer Sale Wheel' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Trigger type', example: 'PAGE_LOAD' })
  @IsOptional()
  @IsIn(['PAGE_LOAD', 'EXIT_INTENT', 'SCROLL', 'BUTTON', 'URL'])
  triggerType?: string;

  @ApiPropertyOptional({ description: 'Trigger value (delay ms, scroll %, URL)', example: '3000' })
  @IsOptional()
  @IsString()
  triggerValue?: string;

  @ApiPropertyOptional({ description: 'Frequency cap', example: 'ONCE_SESSION' })
  @IsOptional()
  @IsIn(['ONCE_SESSION', 'ONCE_DAY', 'ONCE_EVER'])
  frequencyCap?: string;

  @ApiPropertyOptional({ description: 'Device target', example: 'ALL' })
  @IsOptional()
  @IsIn(['ALL', 'MOBILE', 'DESKTOP'])
  deviceTarget?: string;

  @ApiPropertyOptional({ description: 'Collect email before/after spin' })
  @IsOptional()
  @IsBoolean()
  collectEmail?: boolean;

  @ApiPropertyOptional({ description: 'Collect phone' })
  @IsOptional()
  @IsBoolean()
  collectPhone?: boolean;

  @ApiPropertyOptional({ description: 'Collect name' })
  @IsOptional()
  @IsBoolean()
  collectName?: boolean;

  @ApiPropertyOptional({ description: 'Form position', example: 'BEFORE_SPIN' })
  @IsOptional()
  @IsIn(['BEFORE_SPIN', 'AFTER_SPIN'])
  formPosition?: string;

  @ApiPropertyOptional({ description: 'Theme configuration (JSON)' })
  @IsOptional()
  theme?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Scheduled start date' })
  @IsOptional()
  @IsDateString()
  scheduledStart?: string;

  @ApiPropertyOptional({ description: 'Scheduled end date' })
  @IsOptional()
  @IsDateString()
  scheduledEnd?: string;

  @ApiProperty({ description: 'Wheel slices (2-12)', type: [CreateSliceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSliceDto)
  slices!: CreateSliceDto[];
}
