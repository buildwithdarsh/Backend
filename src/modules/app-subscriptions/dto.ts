import { IsString, IsOptional } from 'class-validator';

export class CreateAppSubscriptionDto {
  @IsString()
  planId!: string;

  @IsString()
  @IsOptional()
  promoCode?: string;
}

export class ActivateAppSubscriptionDto {
  @IsString()
  providerOrderId!: string;

  @IsString()
  providerPaymentId!: string;
}
