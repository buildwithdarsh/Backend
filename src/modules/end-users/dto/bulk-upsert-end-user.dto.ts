import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateEndUserDto } from './create-end-user.dto.js';

export class BulkUpsertEndUserDto {
  @ApiProperty({
    description: 'Array of end users to upsert',
    type: [CreateEndUserDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateEndUserDto)
  endUsers!: CreateEndUserDto[];
}
