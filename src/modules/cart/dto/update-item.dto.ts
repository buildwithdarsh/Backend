import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({ description: 'New quantity (0 to remove)' })
  @IsInt()
  @Min(0)
  quantity!: number;
}
