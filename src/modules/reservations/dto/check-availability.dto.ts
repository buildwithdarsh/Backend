import { IsDateString, IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CheckAvailabilityDto {
  @ApiProperty({ description: 'Date to check availability (ISO 8601 date)' })
  @IsNotEmpty()
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ description: 'Party size to filter by capacity', default: 2 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  partySize?: number;
}
