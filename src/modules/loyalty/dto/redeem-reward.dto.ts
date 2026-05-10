import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedeemRewardDto {
  @ApiProperty({ description: 'Reward ID to redeem' })
  @IsNotEmpty()
  @IsUUID()
  rewardId!: string;
}
