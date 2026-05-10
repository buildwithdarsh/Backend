import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSuperAdminDto {
  @ApiProperty({
    description: 'Full name of the super admin',
    example: 'John Doe',
  })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({
    description: 'Email address',
    example: 'admin@build.withdarsh.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Password (min 8 characters)',
    example: 'securePassword123',
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    description: 'Role of the super admin',
    enum: ['super_admin', 'support', 'finance'],
    example: 'super_admin',
  })
  @IsIn(['super_admin', 'support', 'finance'])
  role!: 'super_admin' | 'support' | 'finance';
}
