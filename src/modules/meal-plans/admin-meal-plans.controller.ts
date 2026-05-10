import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetOrg } from '../../common/decorators/index.js';
import { MealPlansService } from './meal-plans.service.js';
import {
  QueryMealPlansDto,
  CreateMealPlanDto,
  UpdateMealPlanDto,
} from './dto/index.js';

@ApiTags('Admin - Meal Plans')
@Controller('api/v1/meal-plans')
export class AdminMealPlansController {
  constructor(private readonly mealPlansService: MealPlansService) {}

  @Get()
  @ApiOperation({ summary: 'List all meal plans' })
  @ApiResponse({ status: 200, description: 'Paginated meal plans list' })
  findAll(@GetOrg() orgId: string, @Query() query: QueryMealPlansDto) {
    return this.mealPlansService.findAll(orgId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single meal plan' })
  @ApiResponse({ status: 200, description: 'Meal plan details' })
  @ApiResponse({ status: 404, description: 'Meal plan not found' })
  findOne(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.mealPlansService.findOne(orgId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a meal plan' })
  @ApiResponse({ status: 201, description: 'Meal plan created' })
  create(@GetOrg() orgId: string, @Body() dto: CreateMealPlanDto) {
    return this.mealPlansService.create(orgId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a meal plan' })
  @ApiResponse({ status: 200, description: 'Meal plan updated' })
  @ApiResponse({ status: 404, description: 'Meal plan not found' })
  update(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMealPlanDto,
  ) {
    return this.mealPlansService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a meal plan' })
  @ApiResponse({ status: 200, description: 'Meal plan deleted' })
  @ApiResponse({ status: 404, description: 'Meal plan not found' })
  remove(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.mealPlansService.remove(orgId, id);
  }
}
