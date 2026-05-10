import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdateAttributesDto {
  @ApiProperty({
    description: 'Key-value attributes to merge into existing attributes',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  attributes!: Record<string, unknown>;
}
