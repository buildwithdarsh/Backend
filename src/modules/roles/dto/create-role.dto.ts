import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name (unique within the organization)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Permission strings (e.g. "users:read", "roles:manage")',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  permissions!: string[];

  @ApiPropertyOptional({
    description: 'Whether this is a default role assigned to new users',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
