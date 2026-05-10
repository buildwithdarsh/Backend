import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RequestMagicLinkDto {
  @ApiProperty({ description: 'Email address', example: 'john@acme.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'Organization slug', example: 'acme-corp' })
  @IsString()
  @IsNotEmpty()
  orgSlug!: string;
}

export class VerifyMagicLinkDto {
  @ApiProperty({ description: 'Magic link token' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ description: 'Organization slug', example: 'acme-corp' })
  @IsString()
  @IsNotEmpty()
  orgSlug!: string;
}
