import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOptionGroupDto {
  @ApiProperty({ description: 'Option group name (e.g. Toppings, Sauces)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Minimum selections required', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minSelection?: number;

  @ApiPropertyOptional({ description: 'Maximum selections allowed', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxSelection?: number;

  @ApiPropertyOptional({ description: 'Display rank / sort order', default: 0 })
  @IsOptional()
  @IsInt()
  rank?: number;
}
