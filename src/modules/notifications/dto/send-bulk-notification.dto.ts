import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { NotificationType } from './send-notification.dto.js';

export class SendBulkNotificationDto {
  @ApiProperty({
    description: 'End user IDs to send notifications to',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  endUserIds!: string[];

  @ApiProperty({
    description: 'Notification delivery channel',
    enum: NotificationType,
  })
  @IsNotEmpty()
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  title!: string;

  @ApiProperty({ description: 'Notification body content' })
  @IsNotEmpty()
  @IsString()
  body!: string;

  @ApiPropertyOptional({ description: 'Image URL for rich notifications' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Additional data payload (JSON)',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Template ID to render body from' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({
    description: 'Variables to pass to the template for rendering',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, unknown>;
}
