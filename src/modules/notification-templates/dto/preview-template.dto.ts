import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';

export class PreviewTemplateDto {
  @ApiProperty({
    description: 'Sample variables to render the template with',
    type: 'object',
    additionalProperties: true,
    example: { name: 'John', orderNumber: '12345' },
  })
  @IsNotEmpty()
  @IsObject()
  variables!: Record<string, unknown>;
}
