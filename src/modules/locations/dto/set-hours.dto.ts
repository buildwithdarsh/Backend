import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StoreHourEntryDto {
  @ApiProperty({ description: 'Day of week (0=Sun, 6=Sat)', minimum: 0, maximum: 6 })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ description: 'Opening time in HH:mm format', example: '09:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'openTime must be in HH:mm format' })
  openTime!: string;

  @ApiProperty({ description: 'Closing time in HH:mm format', example: '22:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'closeTime must be in HH:mm format' })
  closeTime!: string;

  @ApiPropertyOptional({ description: 'Whether the store is closed on this day', default: false })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;
}

export class SetHoursDto {
  @ApiProperty({ description: 'Array of store hour entries', type: [StoreHourEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreHourEntryDto)
  hours!: StoreHourEntryDto[];
}
