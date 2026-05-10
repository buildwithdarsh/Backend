import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryAccountsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by tier' })
  @IsOptional()
  @IsString()
  tier?: string;
}
