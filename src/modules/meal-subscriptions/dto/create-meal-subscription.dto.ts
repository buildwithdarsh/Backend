import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMealSubscriptionDto {
  @ApiProperty({ description: 'Meal plan ID to subscribe to' })
  @IsNotEmpty()
  @IsUUID()
  mealPlanId!: string;

  @ApiPropertyOptional({ description: 'Preferred delivery time (e.g. 12:30)' })
  @IsOptional()
  @IsString()
  deliveryTime?: string;
}
