import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CalculateDeliveryDto {
  @ApiProperty({ description: 'Store location ID' })
  @IsNotEmpty()
  @IsUUID()
  locationId!: string;

  @ApiPropertyOptional({ description: 'Delivery pincode' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  pincode?: string;

  @ApiPropertyOptional({ description: 'Delivery latitude' })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ description: 'Delivery longitude' })
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ description: 'Order type (delivery / pickup)', default: 'delivery' })
  @IsOptional()
  @IsString()
  orderType?: string;
}
