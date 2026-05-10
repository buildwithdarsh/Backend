import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ description: 'Organization display name' })
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

  @ApiProperty({ description: 'Billing contact email' })
  @IsNotEmpty()
  @IsEmail()
  billingEmail!: string;

  @ApiProperty({ description: 'Billing contact name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  billingName!: string;

  @ApiPropertyOptional({ description: 'GST identification number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  gstNumber?: string;

  @ApiPropertyOptional({ description: 'Subscription plan ID' })
  @IsOptional()
  @IsUUID()
  planId?: string;
}
