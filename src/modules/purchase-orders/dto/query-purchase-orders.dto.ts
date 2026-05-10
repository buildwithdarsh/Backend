import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryPurchaseOrdersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsIn(['draft', 'sent', 'received', 'cancelled'])
  status?: string;
}
