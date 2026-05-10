import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIngredientDto {
  @ApiProperty({ description: 'Ingredient name' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Unit of measurement (e.g. kg, litre, piece)' })
  @IsNotEmpty()
  @IsString()
  unit!: string;

  @ApiPropertyOptional({ description: 'Current stock level' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentStock?: number;

  @ApiPropertyOptional({ description: 'Minimum stock threshold for alerts' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({ description: 'Cost per unit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerUnit?: number;

  @ApiPropertyOptional({ description: 'Supplier ID' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;
}
