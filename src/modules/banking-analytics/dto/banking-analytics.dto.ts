import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SetBudgetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category!: string;

  @IsNumber()
  @Min(1)
  monthlyLimit!: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  alertAt?: number;
}
