import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateReservationStatusDto {
  @ApiProperty({
    description: 'New status: pending, confirmed, seated, completed, cancelled, no_show',
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'])
  status!: string;
}
