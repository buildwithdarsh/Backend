import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EndUserSendOtpDto {
  @ApiProperty()
  @IsString()
  orgSlug!: string;

  @ApiProperty({ description: 'Phone number or email' })
  @IsString()
  identifier!: string;

  @ApiProperty({ description: 'Purpose: login, verify_phone, verify_email' })
  @IsString()
  type!: string;
}

export class EndUserVerifyOtpDto {
  @ApiProperty()
  @IsString()
  orgSlug!: string;

  @ApiProperty()
  @IsString()
  identifier!: string;

  @ApiProperty()
  @IsString()
  type!: string;

  @ApiProperty()
  @IsString()
  otp!: string;
}
