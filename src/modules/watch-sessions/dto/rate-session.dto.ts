import { IsInt, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RateSessionDto {
  @ApiProperty({ description: 'Rating 1-5 stars' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
}
