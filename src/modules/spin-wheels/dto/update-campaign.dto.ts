import { IsOptional, IsString, IsBoolean, IsIn, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCampaignDto {
  @ApiPropertyOptional({ description: 'Campaign name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Trigger type' })
  @IsOptional()
  @IsIn(['PAGE_LOAD', 'EXIT_INTENT', 'SCROLL', 'BUTTON', 'URL'])
  triggerType?: string;

  @ApiPropertyOptional({ description: 'Trigger value' })
  @IsOptional()
  @IsString()
  triggerValue?: string;

  @ApiPropertyOptional({ description: 'Frequency cap' })
  @IsOptional()
  @IsIn(['ONCE_SESSION', 'ONCE_DAY', 'ONCE_EVER'])
  frequencyCap?: string;

  @ApiPropertyOptional({ description: 'Device target' })
  @IsOptional()
  @IsIn(['ALL', 'MOBILE', 'DESKTOP'])
  deviceTarget?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  collectEmail?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  collectPhone?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  collectName?: boolean;

  @ApiPropertyOptional({ description: 'Form position' })
  @IsOptional()
  @IsIn(['BEFORE_SPIN', 'AFTER_SPIN'])
  formPosition?: string;

  @ApiPropertyOptional({ description: 'Theme configuration (JSON)' })
  @IsOptional()
  theme?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledEnd?: string;
}

export class UpdateCampaignStatusDto {
  @ApiPropertyOptional({ description: 'Campaign status' })
  @IsIn(['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED'])
  status!: string;
}
