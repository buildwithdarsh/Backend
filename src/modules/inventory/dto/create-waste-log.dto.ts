import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWasteLogDto {
  @ApiProperty({ description: 'Ingredient ID' })
  @IsNotEmpty()
  @IsUUID()
  ingredientId!: string;

  @ApiProperty({ description: 'Quantity wasted' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @ApiProperty({ description: 'Reason for waste' })
  @IsNotEmpty()
  @IsString()
  reason!: string;
}
