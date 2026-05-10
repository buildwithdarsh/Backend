import { PartialType } from '@nestjs/swagger';
import { CreateMealPlanDto } from './create-meal-plan.dto.js';

export class UpdateMealPlanDto extends PartialType(CreateMealPlanDto) {}
