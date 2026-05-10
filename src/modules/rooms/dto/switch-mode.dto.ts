import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SwitchModeDto {
  @ApiProperty({ description: 'New viewing mode', enum: ['sync', 'solo'] })
  @IsEnum(['sync', 'solo'] as const)
  mode!: 'sync' | 'solo';
}
