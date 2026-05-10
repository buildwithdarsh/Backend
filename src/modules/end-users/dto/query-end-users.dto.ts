import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryEndUsersDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['active', 'unsubscribed', 'blocked'],
  })
  @IsOptional()
  @IsIn(['active', 'unsubscribed', 'blocked'])
  status?: 'active' | 'unsubscribed' | 'blocked';

  @ApiPropertyOptional({
    description: 'Filter by tags (comma-separated or array)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((t: string) => t.trim()) : value,
  )
  tags?: string[];
}
