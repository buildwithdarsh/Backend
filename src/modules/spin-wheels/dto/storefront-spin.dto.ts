import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StorefrontSpinDto {
  @ApiProperty({ description: 'Campaign ID' })
  @IsNotEmpty()
  @IsUUID()
  campaignId!: string;

  @ApiProperty({ description: 'Shop domain' })
  @IsNotEmpty()
  @IsString()
  shopDomain!: string;

  @ApiPropertyOptional({ description: 'Customer email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Customer phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Customer name' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class StorefrontImpressionDto {
  @ApiProperty({ description: 'Campaign ID' })
  @IsNotEmpty()
  @IsUUID()
  campaignId!: string;

  @ApiProperty({ description: 'Shop domain' })
  @IsNotEmpty()
  @IsString()
  shopDomain!: string;
}
