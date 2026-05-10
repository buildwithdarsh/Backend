import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateAccountNicknameDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nickname!: string;
}

export class SetAutoSweepDto {
  @IsBoolean()
  enabled!: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  threshold?: number;
}

export class CreateFixedDepositDto {
  @IsUUID()
  @IsNotEmpty()
  accountId!: string;

  @IsNumber()
  @Min(1000)
  principalAmount!: number;

  @IsInt()
  @Min(7)
  @Max(3650)
  tenureDays!: number;

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}
