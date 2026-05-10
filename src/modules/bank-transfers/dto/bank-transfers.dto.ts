import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class InitiateTransferDto {
  @IsUUID()
  @IsNotEmpty()
  senderAccountId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  beneficiaryAccount!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  beneficiaryIfsc!: string;

  @IsString()
  @IsNotEmpty()
  beneficiaryName!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsEnum(['neft', 'rtgs', 'imps', 'upi', 'swift', 'internal'])
  mode!: 'neft' | 'rtgs' | 'imps' | 'upi' | 'swift' | 'internal';

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  upiId?: string;
}

export class AddBeneficiaryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  accountNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  ifscCode!: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  upiId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  nickname?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  transferLimit?: number;
}

export class CreateScheduledTransferDto {
  @IsUUID()
  @IsNotEmpty()
  senderAccountId!: string;

  @IsString()
  @IsNotEmpty()
  beneficiaryName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  beneficiaryAccount!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  beneficiaryIfsc!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsEnum(['neft', 'rtgs', 'imps', 'upi', 'swift', 'internal'])
  mode!: 'neft' | 'rtgs' | 'imps' | 'upi' | 'swift' | 'internal';

  @IsEnum(['once', 'daily', 'weekly', 'monthly'])
  frequency!: 'once' | 'daily' | 'weekly' | 'monthly';

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  nextExecutionAt!: string;

  @IsString()
  @IsOptional()
  endsAt?: string;
}

export class PayBillDto {
  @IsUUID()
  @IsNotEmpty()
  accountId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  billerCategory!: string;

  @IsString()
  @IsNotEmpty()
  billerName!: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  billerId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  consumerNumber!: string;

  @IsNumber()
  @Min(1)
  amount!: number;
}
