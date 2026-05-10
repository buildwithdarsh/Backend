import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCapDto {
  @ApiProperty({ description: 'New meter cap in paise (use large number for unlimited)' })
  @IsInt()
  @Min(1)
  meterCapPaise!: number;
}
