import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrgConfigDto {
  // ─── Active Providers ────────────────────────────────────────────────
  @ApiPropertyOptional({ description: 'Active payment provider (e.g. razorpay, stripe)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  activePaymentProvider?: string;

  @ApiPropertyOptional({ description: 'Active OTP provider (e.g. msg91, twilio)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  activeOtpProvider?: string;

  @ApiPropertyOptional({ description: 'Active email provider (e.g. smtp, resend, msg91)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  activeEmailProvider?: string;

  @ApiPropertyOptional({ description: 'Active SMS provider' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  activeSmsProvider?: string;

  @ApiPropertyOptional({ description: 'Active WhatsApp provider' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  activeWhatsappProvider?: string;

  @ApiPropertyOptional({ description: 'Active push notification provider' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  activePushProvider?: string;

  @ApiPropertyOptional({ description: 'Active storage provider (e.g. s3, r2)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  activeStorageProvider?: string;

  // ─── OTP ─────────────────────────────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  otpMsg91AuthKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  otpTwilioAccountSid?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  otpTwilioAuthToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  otpTwilioFromNumber?: string;

  // ─── Email ───────────────────────────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emailFromName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emailFromAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emailMsg91AuthKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emailSmtpHost?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  emailSmtpPort?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emailSmtpUser?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emailSmtpPass?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailSmtpSecure?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emailResendApiKey?: string;

  // ─── SMS ─────────────────────────────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smsMsg91AuthKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smsMsg91SenderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smsTwilioAccountSid?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smsTwilioAuthToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smsTwilioFromNumber?: string;

  // ─── WhatsApp ────────────────────────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whatsappMsg91AuthKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whatsappMsg91Number?: string;

  // ─── Payment — Razorpay ──────────────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentRazorpayKeyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentRazorpayKeySecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentRazorpayWebhookSecret?: string;

  // ─── Payment — Stripe ────────────────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentStripePublishableKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentStripeSecretKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentStripeWebhookSecret?: string;

  // ─── Push (FCM) ──────────────────────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pushFcmServerKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pushFcmProjectId?: string;

  // ─── Storage ─────────────────────────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storageS3AccessKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storageS3SecretKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storageS3Bucket?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storageS3Region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storageR2AccessKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storageR2SecretKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storageR2Bucket?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storageR2Endpoint?: string;

  // ─── OAuth ───────────────────────────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  oauthGoogleClientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  oauthGoogleClientSecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  oauthGithubClientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  oauthGithubClientSecret?: string;

  // ─── General ─────────────────────────────────────────────────────────
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedOrigins?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ipWhitelist?: string[];
}
