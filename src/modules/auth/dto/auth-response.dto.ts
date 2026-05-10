import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ description: 'User ID (UUID)' })
  id!: string;

  @ApiProperty({ description: 'User full name' })
  name!: string;

  @ApiProperty({ description: 'User email address' })
  email!: string;

  @ApiProperty({ description: 'Organization ID (UUID)' })
  orgId!: string;

  @ApiProperty({ description: 'Assigned role IDs', type: [String] })
  roles!: string[];
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken!: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken!: string;

  @ApiProperty({ description: 'Authenticated user details', type: AuthUserDto })
  user!: AuthUserDto;
}
