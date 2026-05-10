import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitKycDto {
  @IsEnum(['aadhaar', 'pan', 'passport', 'voter_id', 'driving_license'])
  @IsNotEmpty()
  documentType!: 'aadhaar' | 'pan' | 'passport' | 'voter_id' | 'driving_license';

  @IsString()
  @IsNotEmpty()
  documentNumber!: string;

  @IsString()
  @IsOptional()
  documentUrl?: string;

  @IsString()
  @IsOptional()
  selfieUrl?: string;
}

export class VerifyKycDto {
  @IsEnum(['verified', 'rejected'])
  @IsNotEmpty()
  status!: 'verified' | 'rejected';

  @IsString()
  @IsOptional()
  rejectionNote?: string;
}
