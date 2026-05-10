import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateReferralDto {
  @ApiProperty({ description: 'Referral code to validate' })
  @IsNotEmpty()
  @IsString()
  code!: string;
}
