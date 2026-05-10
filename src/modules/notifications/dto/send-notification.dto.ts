import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum NotificationType {
  in_app = 'in_app',
  email = 'email',
  sms = 'sms',
  push = 'push',
  whatsapp = 'whatsapp',
}

export class SendNotificationDto {
  @ApiPropertyOptional({ description: 'End user ID to send notification to' })
  @IsOptional()
  @IsUUID()
  endUserId?: string;

  @ApiPropertyOptional({ description: 'Internal user ID to send notification to' })
  @IsOptional()
  @IsUUID()
  userId?: string;

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
