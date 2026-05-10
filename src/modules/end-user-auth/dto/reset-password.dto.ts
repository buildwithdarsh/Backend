import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EndUserRequestResetDto {
  @ApiProperty()
  @IsString()
  orgSlug!: string;

  @ApiProperty({ description: 'Email or phone' })
  @IsString()
  identifier!: string;
}

export class EndUserResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
