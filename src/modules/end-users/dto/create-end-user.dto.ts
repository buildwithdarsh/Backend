import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEndUserDto {
  @ApiPropertyOptional({ description: 'External identifier from your system' })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({ description: 'Full name of the end user' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Avatar image URL' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Firebase Cloud Messaging token' })
  @IsOptional()
  @IsString()
  fcmToken?: string;

  @ApiPropertyOptional({ description: 'WhatsApp phone number' })
  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Custom key-value attributes',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Subscribed to email notifications',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isSubscribedEmail?: boolean;

  @ApiPropertyOptional({
    description: 'Subscribed to SMS notifications',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isSubscribedSms?: boolean;

  @ApiPropertyOptional({
    description: 'Subscribed to WhatsApp notifications',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isSubscribedWhatsapp?: boolean;

  @ApiPropertyOptional({
    description: 'Subscribed to push notifications',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isSubscribedPush?: boolean;
}
