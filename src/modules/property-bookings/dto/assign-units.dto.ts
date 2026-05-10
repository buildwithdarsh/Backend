import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignUnitsDto {
  @ApiProperty({ description: 'Unit IDs to assign to booking', type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  unitIds!: string[];
}
