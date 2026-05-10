import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Prisma } from '@prisma/client';

export class CreateResourceDto {
  @ApiPropertyOptional({ description: 'Location ID' })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty({ description: 'Resource name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Resource type (table, room, seat, court)', default: 'table' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  type?: string;

  @ApiPropertyOptional({ description: 'Capacity', default: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ description: 'Whether the resource is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON' })
  @IsOptional()
  metadata?: Prisma.InputJsonValue;
}
