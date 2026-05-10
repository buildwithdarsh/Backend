import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBookingDto {
  @ApiPropertyOptional({ description: 'Guest name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  guestName?: string;

  @ApiPropertyOptional({ description: 'Guest phone' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  guestPhone?: string;

  @ApiPropertyOptional({ description: 'Guest email' })
  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @ApiPropertyOptional({ description: 'Special requests' })
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiPropertyOptional({ description: 'Admin notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
