import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export enum TemplateChannel {
  email = 'email',
  sms = 'sms',
  push = 'push',
  whatsapp = 'whatsapp',
}

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    description:
      'URL-friendly slug. Auto-generated from name if not provided.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with hyphens only',
  })
  slug?: string;

  @ApiProperty({
    description: 'Notification channel this template is for',
    enum: TemplateChannel,
  })
  @IsNotEmpty()
  @IsEnum(TemplateChannel)
  channel!: TemplateChannel;

  @ApiPropertyOptional({
    description: 'Email subject line (required for email channel)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(998)
  subject?: string;

  @ApiProperty({
    description: 'Template body (Handlebars template syntax supported)',
  })
  @IsNotEmpty()
  @IsString()
  body!: string;

  @ApiPropertyOptional({
    description:
      'JSON schema or list describing template variables for documentation',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  variables?: unknown;

  @ApiPropertyOptional({ description: 'MSG91 template ID for SMS/WhatsApp' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  msg91TemplateId?: string;
}
