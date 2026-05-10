import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  IsBoolean,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum BillingCycleDto {
  monthly = 'monthly',
  quarterly = 'quarterly',
  half_yearly = 'half_yearly',
  yearly = 'yearly',
  weekly = 'weekly',
  lifetime = 'lifetime',
}

export enum TrackedSubStatusDto {
  active = 'active',
  cancelled = 'cancelled',
  paused = 'paused',
  forgotten = 'forgotten',
  free_trial = 'free_trial',
}

export class AddTrackedSubscriptionDto {
  @ApiProperty({ example: 'Netflix' })
  @IsString()
  @IsNotEmpty()
  serviceName!: string;

  @ApiPropertyOptional({ example: 'netflix.com' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ example: 'https://logo.clearbit.com/netflix.com' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ example: 'streaming' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ description: 'Amount in paise (₹ × 100)', example: 64900 })
  @IsInt()
  @Min(0)
  amountPaise!: number;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ enum: BillingCycleDto })
  @IsEnum(BillingCycleDto)
  billingCycle!: BillingCycleDto;

  @ApiPropertyOptional({ example: '2025-05-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  nextRenewalAt?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isFreeTrialDetected?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  freeTrialEndsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTrackedSubscriptionDto {
  @ApiPropertyOptional({ example: 'Netflix Premium' })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Amount in paise' })
  @IsOptional()
  @IsInt()
  @Min(0)
  amountPaise?: number;

  @ApiPropertyOptional({ enum: BillingCycleDto })
  @IsOptional()
  @IsEnum(BillingCycleDto)
  billingCycle?: BillingCycleDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextRenewalAt?: string;

  @ApiPropertyOptional({ enum: TrackedSubStatusDto })
  @IsOptional()
  @IsEnum(TrackedSubStatusDto)
  status?: TrackedSubStatusDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryTrackedSubscriptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: TrackedSubStatusDto })
  @IsOptional()
  @IsEnum(TrackedSubStatusDto)
  status?: TrackedSubStatusDto;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;
}
