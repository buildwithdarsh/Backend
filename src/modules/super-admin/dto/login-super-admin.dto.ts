import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginSuperAdminDto {
  @ApiProperty({
    description: 'Super admin email address',
    example: 'admin@build.withdarsh.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Super admin password',
    example: 'securePassword123',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
