import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOptionDto {
  @ApiProperty({ description: 'Option name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'Option price (additional cost)' })
  @IsNotEmpty()
  @IsNumber()
  price!: number;

  @ApiPropertyOptional({ description: 'Whether the option is in stock', default: true })
  @IsOptional()
  @IsBoolean()
  inStock?: boolean;

  @ApiPropertyOptional({ description: 'Display rank / sort order', default: 0 })
  @IsOptional()
  @IsInt()
  rank?: number;

  @ApiPropertyOptional({ description: 'Whether the option is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
