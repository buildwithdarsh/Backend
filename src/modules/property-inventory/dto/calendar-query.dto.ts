import { IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalendarQueryDto {
  @ApiProperty({ description: 'Start date (ISO 8601)' })
  @IsNotEmpty()
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'End date (ISO 8601)' })
  @IsNotEmpty()
  @IsDateString()
  endDate!: string;
}
