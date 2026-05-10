import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EndUserDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string | null;
  @ApiProperty() email!: string | null;
  @ApiProperty() phone!: string | null;
  @ApiProperty() orgId!: string;
  @ApiProperty() isPhoneVerified!: boolean;
  @ApiProperty() isEmailVerified!: boolean;
  @ApiProperty() onboardingStep!: number;
  @ApiPropertyOptional() avatarUrl!: string | null;
  @ApiPropertyOptional() referralCode!: string | null;
}

export class EndUserAuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ type: EndUserDto })
  user!: EndUserDto;

  @ApiPropertyOptional({ description: 'The configured primary login identifier type (phone or email)' })
  primaryLoginId?: string;
}
