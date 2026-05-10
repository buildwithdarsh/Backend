import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Email address', example: 'john@acme.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'Password' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ description: 'Organization slug', example: 'acme-corp' })
  @IsString()
  @IsNotEmpty()
  orgSlug!: string;
}
