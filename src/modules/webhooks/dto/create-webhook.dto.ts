import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty({ description: 'Webhook name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    description: 'URL to deliver webhook events to',
    example: 'https://example.com/webhooks',
  })
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  url!: string;

  @ApiProperty({
    description: 'Event types this webhook listens to',
    type: [String],
    example: ['notification.sent', 'campaign.completed'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  events!: string[];

  @ApiPropertyOptional({
    description: 'Maximum number of retry attempts for failed deliveries',
    default: 3,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  maxRetries?: number;
}
