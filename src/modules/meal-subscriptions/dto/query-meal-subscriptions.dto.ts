import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryMealSubscriptionsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by status (active, paused, cancelled, expired)' })
  @IsOptional()
  @IsString()
  status?: string;
}
