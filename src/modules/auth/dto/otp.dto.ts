import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum OtpTypeEnum {
  LOGIN = 'login',
  PHONE_VERIFY = 'phone_verify',
  EMAIL_VERIFY = 'email_verify',
  PASSWORD_RESET = 'password_reset',
}

export class SendOtpDto {
  @ApiProperty({
    description: 'Email or phone number',
    example: 'john@acme.com',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({
    description: 'OTP type',
    enum: OtpTypeEnum,
    example: OtpTypeEnum.LOGIN,
  })
  @IsEnum(OtpTypeEnum)
  type!: OtpTypeEnum;

  @ApiProperty({ description: 'Organization slug', example: 'acme-corp' })
  @IsString()
  @IsNotEmpty()
  orgSlug!: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Email or phone number',
    example: 'john@acme.com',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({ description: '6-digit OTP code', example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp!: string;

  @ApiProperty({
    description: 'OTP type',
    enum: OtpTypeEnum,
    example: OtpTypeEnum.LOGIN,
  })
  @IsEnum(OtpTypeEnum)
  type!: OtpTypeEnum;

  @ApiProperty({ description: 'Organization slug', example: 'acme-corp' })
  @IsString()
  @IsNotEmpty()
  orgSlug!: string;
}
