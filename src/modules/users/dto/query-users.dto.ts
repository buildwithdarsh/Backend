import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export enum UserStatusFilter {
  active = 'active',
  invited = 'invited',
  suspended = 'suspended',
  blocked = 'blocked',
}

export class QueryUsersDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: UserStatusFilter,
    description: 'Filter by user status',
  })
  @IsOptional()
  @IsEnum(UserStatusFilter)
  status?: UserStatusFilter;
}
