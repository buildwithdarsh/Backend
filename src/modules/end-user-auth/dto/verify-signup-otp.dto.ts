import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifySignupOtpDto {
  @ApiProperty()
  @IsString()
  orgSlug!: string;

  @ApiProperty({ description: 'Phone number' })
  @IsString()
  phone!: string;

  @ApiProperty()
  @IsString()
  otp!: string;
}
