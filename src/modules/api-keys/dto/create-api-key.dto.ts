import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'Human-readable name for the API key', example: 'Production Key' })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Environment for this key',
    enum: ['live', 'test'],
    example: 'live',
  })
  @IsIn(['live', 'test'])
  environment!: 'live' | 'test';

  @ApiProperty({
    description: 'Permission scopes granted to this key',
    type: [String],
    example: ['notifications:send', 'end-users:read'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  scopes!: string[];

  @ApiPropertyOptional({
    description: 'Rate limit in requests per minute (default 60)',
    example: 120,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  rateLimitPerMinute?: number;

  @ApiPropertyOptional({
    description: 'Expiration date (ISO 8601). Omit for no expiry.',
    example: '2027-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
