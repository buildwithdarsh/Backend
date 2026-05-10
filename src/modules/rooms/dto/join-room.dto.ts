import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinRoomDto {
  @ApiProperty({ description: 'Viewing mode', enum: ['sync', 'solo'] })
  @IsEnum(['sync', 'solo'] as const)
  mode!: 'sync' | 'solo';
}
