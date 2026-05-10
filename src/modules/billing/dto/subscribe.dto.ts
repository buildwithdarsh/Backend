import { IsIn, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribeDto {
  @ApiProperty({
    description: 'ID of the plan to subscribe to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  planId!: string;

  @ApiProperty({
    description: 'Billing interval',
    enum: ['monthly', 'yearly'],
    example: 'monthly',
  })
  @IsIn(['monthly', 'yearly'])
  interval!: 'monthly' | 'yearly';
}
