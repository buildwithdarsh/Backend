import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeliveryZoneDto {
  @ApiProperty({ description: 'Zone display name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Array of pincode strings covered by this zone', default: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pincodes?: string[];

  @ApiPropertyOptional({ description: 'Delivery radius in kilometers' })
  @IsOptional()
  @IsNumber()
  radiusKm?: number;

  @ApiPropertyOptional({ description: 'Center latitude for radius-based zone' })
  @IsOptional()
  @IsNumber()
  centerLat?: number;

  @ApiPropertyOptional({ description: 'Center longitude for radius-based zone' })
  @IsOptional()
  @IsNumber()
  centerLng?: number;

  @ApiPropertyOptional({ description: 'Delivery fee for this zone', default: 0 })
  @IsOptional()
  @IsNumber()
  fee?: number;

  @ApiPropertyOptional({ description: 'Minimum order amount for delivery in this zone' })
  @IsOptional()
  @IsNumber()
  minOrder?: number;

  @ApiPropertyOptional({ description: 'Whether the zone is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
