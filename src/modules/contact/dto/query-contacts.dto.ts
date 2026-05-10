import { IsOptional, IsIn } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryContactsDto extends PaginationDto {
  @IsOptional()
  @IsIn(['true', 'false'])
  isRead?: string;
}
