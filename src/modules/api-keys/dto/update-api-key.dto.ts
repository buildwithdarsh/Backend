import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateApiKeyDto {
  @ApiPropertyOptional({ description: 'Updated name for the API key' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated permission scopes',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @ApiPropertyOptional({
    description: 'Updated rate limit in requests per minute',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  rateLimitPerMinute?: number;
}
