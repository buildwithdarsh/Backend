import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateSegmentDto {
  @ApiProperty({ description: 'Segment name', example: 'VIP Customers' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Segment description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Segment type',
    enum: ['static', 'dynamic'],
    example: 'static',
  })
  @IsIn(['static', 'dynamic'])
  type!: 'static' | 'dynamic';

  @ApiPropertyOptional({
    description: 'Dynamic segment filter conditions (JSONB)',
    type: 'object',
    additionalProperties: true,
    example: {
      rules: [
        { field: 'tags', operator: 'contains', value: 'premium' },
        { field: 'status', operator: 'eq', value: 'active' },
      ],
      combinator: 'and',
    },
  })
  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown>;
}
