import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ description: 'Property type ID' })
  @IsNotEmpty()
  @IsUUID()
  propertyTypeId!: string;

  @ApiProperty({ description: 'Check-in date (ISO 8601)' })
  @IsNotEmpty()
  @IsDateString()
  checkInDate!: string;

  @ApiProperty({ description: 'Check-out date (ISO 8601)' })
  @IsNotEmpty()
  @IsDateString()
  checkOutDate!: string;

  @ApiPropertyOptional({ description: 'Number of guests', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  guestCount?: number;

  @ApiProperty({ description: 'Guest name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  guestName!: string;

  @ApiProperty({ description: 'Guest phone' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  guestPhone!: string;

  @ApiPropertyOptional({ description: 'Guest email' })
  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @ApiPropertyOptional({ description: 'Coupon code' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  couponCode?: string;

  @ApiPropertyOptional({ description: 'Special requests' })
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiPropertyOptional({ description: 'Payment type: full or partial' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  paymentType?: string;
}
