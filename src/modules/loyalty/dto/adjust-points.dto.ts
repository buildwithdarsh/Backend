import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustPointsDto {
  @ApiProperty({ description: 'Points to adjust (positive to add, negative to subtract)' })
  @IsNotEmpty()
  @IsInt()
  points!: number;

  @ApiProperty({ description: 'Reason for adjustment' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiPropertyOptional({ description: 'Optional commerce order ID' })
  @IsOptional()
  @IsString()
  commerceOrderId?: string;
}
