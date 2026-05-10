import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ description: 'Supplier company name' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Primary contact person name' })
  @IsNotEmpty()
  @IsString()
  contactName!: string;

  @ApiProperty({ description: 'Contact phone number' })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiPropertyOptional({ description: 'Contact email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Average lead time in days', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Whether the supplier is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
