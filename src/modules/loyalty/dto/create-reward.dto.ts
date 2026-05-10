import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRewardDto {
  @ApiProperty({ description: 'URL-friendly slug (unique per org)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  slug!: string;

  @ApiProperty({ description: 'Reward display name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Reward description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Points cost to redeem this reward' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  pointsCost!: number;

  @ApiProperty({ description: 'Reward type: discount, freeItem, voucher' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  type!: string;

  @ApiPropertyOptional({ description: 'Additional reward configuration' })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Reward image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Whether the reward is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
