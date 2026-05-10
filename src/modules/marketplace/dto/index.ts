import { IsString, IsOptional, IsArray, IsNumber, IsEnum, IsBoolean, Min, Max } from 'class-validator';

// ─── Enums ──────────────────────────────────────────────────────────────────

export enum MarketplaceUserType {
  EXPERIENCER = 'experiencer',
  PROVIDER = 'provider',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

// ─── Profile DTOs ───────────────────────────────────────────────────────────

export class CreateProfileDto {
  @IsEnum(MarketplaceUserType)
  userType!: MarketplaceUserType;

  @IsArray() @IsString({ each: true })
  categories!: string[];

  @IsArray() @IsString({ each: true }) @IsOptional()
  subcategories?: string[];

  @IsString()
  city!: string;

  @IsString() @IsOptional()
  workMode?: string;

  @IsNumber() @Min(0)
  hourlyRateMin!: number;

  @IsNumber() @IsOptional()
  hourlyRateMax?: number;

  @IsString() @IsOptional()
  hoursBand?: string;

  @IsArray() @IsString({ each: true }) @IsOptional()
  scheduleSlots?: string[];

  @IsString() @IsOptional()
  headline?: string;

  @IsString() @IsOptional()
  pitchText?: string;
}

export class UpdateProfileDto {
  @IsArray() @IsString({ each: true }) @IsOptional()
  categories?: string[];

  @IsArray() @IsString({ each: true }) @IsOptional()
  subcategories?: string[];

  @IsString() @IsOptional()
  city?: string;

  @IsString() @IsOptional()
  workMode?: string;

  @IsNumber() @IsOptional()
  hourlyRateMin?: number;

  @IsNumber() @IsOptional()
  hourlyRateMax?: number;

  @IsString() @IsOptional()
  hoursBand?: string;

  @IsArray() @IsString({ each: true }) @IsOptional()
  scheduleSlots?: string[];

  @IsString() @IsOptional()
  headline?: string;

  @IsString() @IsOptional()
  pitchText?: string;

  @IsBoolean() @IsOptional()
  isActive?: boolean;
}

// ─── Opportunity DTOs ───────────────────────────────────────────────────────

export class CreateOpportunityDto {
  @IsString()
  title!: string;

  @IsString() @IsOptional()
  description?: string;

  @IsString()
  category!: string;

  @IsString() @IsOptional()
  subcategory?: string;

  @IsString()
  city!: string;

  @IsString() @IsOptional()
  workMode?: string;

  @IsNumber() @Min(1)
  hoursNeeded!: number;

  @IsNumber() @Min(0)
  hourlyBudget!: number;

  @IsString() @IsOptional()
  scheduledDate?: string;

  @IsString() @IsOptional()
  scheduledTime?: string;

  @IsBoolean() @IsOptional()
  isRecurring?: boolean;
}

export class UpdateOpportunityDto {
  @IsString() @IsOptional()
  title?: string;

  @IsString() @IsOptional()
  description?: string;

  @IsNumber() @IsOptional()
  hoursNeeded?: number;

  @IsNumber() @IsOptional()
  hourlyBudget?: number;

  @IsString() @IsOptional()
  scheduledDate?: string;

  @IsString() @IsOptional()
  status?: string;
}

// ─── Booking DTOs ───────────────────────────────────────────────────────────

export class CreateBookingDto {
  @IsString()
  opportunityId!: string;

  @IsString()
  date!: string;

  @IsString() @IsOptional()
  startTime?: string;

  @IsNumber() @Min(1)
  durationHours!: number;

  @IsString() @IsOptional()
  message?: string;
}

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status!: BookingStatus;

  @IsString() @IsOptional()
  note?: string;
}

// ─── Review DTOs ────────────────────────────────────────────────────────────

export class CreateReviewDto {
  @IsString()
  bookingId!: string;

  @IsNumber() @Min(1) @Max(5)
  rating!: number;

  @IsString() @IsOptional()
  text?: string;
}

// ─── Onboarding DTO ─────────────────────────────────────────────────────────

export class SaveOnboardingDto {
  @IsString()
  userType!: string;

  @IsArray() @IsString({ each: true })
  categories!: string[];

  @IsArray() @IsString({ each: true }) @IsOptional()
  subcategories?: string[];

  @IsString() @IsOptional()
  hourlyRateBand?: string;

  @IsString() @IsOptional()
  hoursBand?: string;

  @IsArray() @IsString({ each: true }) @IsOptional()
  scheduleSlots?: string[];

  @IsString() @IsOptional()
  city?: string;

  @IsString() @IsOptional()
  workMode?: string;

  @IsString() @IsOptional()
  budgetBand?: string;

  @IsString() @IsOptional()
  needWhen?: string;

  @IsNumber() @IsOptional()
  onboardingStep?: number;
}
