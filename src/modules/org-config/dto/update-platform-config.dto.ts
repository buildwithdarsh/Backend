import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePlatformConfigDto {
  @ApiProperty({ description: 'Config group (e.g. otp, email, sms, payment)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  group!: string;

  @ApiProperty({ description: 'Config key within the group' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  key!: string;

  @ApiProperty({ description: 'Config value' })
  @IsNotEmpty()
  @IsString()
  value!: string;

  @ApiPropertyOptional({
    description: 'Whether this value should be encrypted at rest',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isSecret?: boolean;

  @ApiPropertyOptional({ description: 'Human-readable description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
