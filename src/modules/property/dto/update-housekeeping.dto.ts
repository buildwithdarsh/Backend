import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateHousekeepingDto {
  @ApiProperty({ description: 'Housekeeping status: clean, dirty, in_progress, inspected' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  status!: string;
}
