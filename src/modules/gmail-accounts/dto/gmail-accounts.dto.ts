import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GmailCallbackDto {
  @ApiProperty({ description: 'OAuth authorization code from Google' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}
