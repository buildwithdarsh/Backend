import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CartItemOptionDto {
  @ApiProperty()
  @IsUUID()
  optionId!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class AddCartItemDto {
  @ApiProperty()
  @IsUUID()
  itemId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sizeVariationId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiProperty()
  @IsString()
  variantType!: string;

  @ApiPropertyOptional({ type: [CartItemOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemOptionDto)
  options?: CartItemOptionDto[];
}
