import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketReplyDto {
  @ApiProperty({ description: 'Reply message body' })
  @IsNotEmpty()
  @IsString()
  body!: string;
}
