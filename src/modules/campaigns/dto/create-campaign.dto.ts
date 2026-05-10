import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum CampaignChannel {
  email = 'email',
  sms = 'sms',
  push = 'push',
  whatsapp = 'whatsapp',
  multi = 'multi',
}

export class CreateCampaignDto {
  @ApiProperty({ description: 'Campaign name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Campaign description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Delivery channel',
    enum: CampaignChannel,
  })
  @IsNotEmpty()
  @IsEnum(CampaignChannel)
  channel!: CampaignChannel;

  @ApiProperty({ description: 'Notification template ID to use' })
  @IsNotEmpty()
  @IsUUID()
  templateId!: string;

  @ApiPropertyOptional({ description: 'Segment ID to target' })
  @IsOptional()
  @IsUUID()
  segmentId?: string;

  @ApiPropertyOptional({
    description: 'Custom audience filter criteria (JSON)',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  audienceFilter?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Scheduled send time (ISO 8601)',
    example: '2026-04-01T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({
    description: 'IANA timezone for scheduling (e.g. Asia/Kolkata)',
    example: 'Asia/Kolkata',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;
}
