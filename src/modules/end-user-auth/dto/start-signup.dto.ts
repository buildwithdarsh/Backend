import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartSignupDto {
  @ApiProperty()
  @IsString()
  orgSlug!: string;

  @ApiProperty({ description: 'Phone number' })
  @IsString()
  phone!: string;
}
