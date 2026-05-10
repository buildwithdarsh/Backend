import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class GenerateVirtualCardDto {
  @IsEnum(['debit', 'credit'])
  @IsNotEmpty()
  cardType!: 'debit' | 'credit';

  @IsUUID()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsNotEmpty()
  nameOnCard!: string;

  @IsString()
  @IsOptional()
  cardNetwork?: string;
}

export class UpdateCardLimitsDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  dailyLimit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  atmWithdrawalLimit?: number;
}

export class ToggleInternationalDto {
  @IsBoolean()
  enabled!: boolean;

  @IsString()
  @IsOptional()
  from?: string;

  @IsString()
  @IsOptional()
  until?: string;
}

export class ToggleCardFeatureDto {
  @IsBoolean()
  enabled!: boolean;
}
