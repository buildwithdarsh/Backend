import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryGiftCardsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by status (active, exhausted, expired, cancelled)' })
  @IsOptional()
  @IsString()
  status?: string;
}
