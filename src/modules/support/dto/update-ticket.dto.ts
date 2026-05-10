import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTicketDto {
  @ApiPropertyOptional({ description: 'Status: open, in_progress, resolved, closed' })
  @IsOptional()
  @IsString()
  @IsIn(['open', 'in_progress', 'resolved', 'closed'])
  status?: string;

  @ApiPropertyOptional({ description: 'Priority: low, normal, high, urgent' })
  @IsOptional()
  @IsString()
  @IsIn(['low', 'normal', 'high', 'urgent'])
  priority?: string;

  @ApiPropertyOptional({ description: 'Category' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({ description: 'Assigned to user ID' })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}
