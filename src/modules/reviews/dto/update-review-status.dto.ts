import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateReviewStatusDto {
  @ApiProperty({ description: 'New status: approved or rejected' })
  @IsNotEmpty()
  @IsString()
  @IsIn(['approved', 'rejected'])
  status!: string;
}
