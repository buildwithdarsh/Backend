import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRolesDto {
  @ApiProperty({
    description: 'Array of role IDs to assign to the user',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds!: string[];
}
