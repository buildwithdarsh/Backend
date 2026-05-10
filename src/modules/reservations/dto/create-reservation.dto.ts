import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiPropertyOptional({ description: 'Resource ID to book' })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'Reservation slot ID' })
  @IsOptional()
  @IsUUID()
  slotId?: string;

  @ApiProperty({ description: 'Reservation date (ISO 8601 date)' })
  @IsNotEmpty()
  @IsDateString()
  date!: string;

  @ApiProperty({ description: 'Start time (HH:MM format)' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:MM format' })
  startTime!: string;

  @ApiPropertyOptional({ description: 'End time (HH:MM format)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:MM format' })
  endTime?: string;

  @ApiPropertyOptional({ description: 'Party size', default: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  partySize?: number;

  @ApiProperty({ description: 'Customer name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  customerName!: string;

  @ApiProperty({ description: 'Customer phone' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  customerPhone!: string;

  @ApiPropertyOptional({ description: 'Notes or special requests' })
  @IsOptional()
  @IsString()
  notes?: string;
}
