import { PrismaClient } from '@prisma/client';

interface PlatformConfigEntry {
  group: string;
  key: string;
  value: string;
  isSecret: boolean;
  description: string;
}

const PLATFORM_CONFIGS: PlatformConfigEntry[] = [
  // OTP
  { group: 'otp', key: 'active_provider', value: '', isSecret: false, description: 'Active OTP provider (msg91 | twilio)' },
  { group: 'otp', key: 'msg91_auth_key', value: '', isSecret: true, description: 'MSG91 auth key for OTP' },
  { group: 'otp', key: 'twilio_account_sid', value: '', isSecret: true, description: 'Twilio account SID for OTP' },
  { group: 'otp', key: 'twilio_auth_token', value: '', isSecret: true, description: 'Twilio auth token for OTP' },
  { group: 'otp', key: 'twilio_from_number', value: '', isSecret: false, description: 'Twilio sender number for OTP' },
  // Email
  { group: 'email', key: 'active_provider', value: '', isSecret: false, description: 'Active email provider (msg91 | smtp | resend)' },
  { group: 'email', key: 'from_name', value: '', isSecret: false, description: 'Default email from name' },
  { group: 'email', key: 'from_address', value: '', isSecret: false, description: 'Default email from address' },
  { group: 'email', key: 'msg91_auth_key', value: '', isSecret: true, description: 'MSG91 auth key for email' },
  { group: 'email', key: 'smtp_host', value: '', isSecret: false, description: 'SMTP host' },
  { group: 'email', key: 'smtp_port', value: '', isSecret: false, description: 'SMTP port' },
  { group: 'email', key: 'smtp_user', value: '', isSecret: true, description: 'SMTP username' },
  { group: 'email', key: 'smtp_pass', value: '', isSecret: true, description: 'SMTP password' },
  { group: 'email', key: 'smtp_secure', value: 'true', isSecret: false, description: 'SMTP use TLS' },
  { group: 'email', key: 'resend_api_key', value: '', isSecret: true, description: 'Resend API key' },
  // SMS
  { group: 'sms', key: 'active_provider', value: '', isSecret: false, description: 'Active SMS provider (msg91 | twilio)' },
  { group: 'sms', key: 'msg91_auth_key', value: '', isSecret: true, description: 'MSG91 auth key for SMS' },
  { group: 'sms', key: 'msg91_sender_id', value: '', isSecret: false, description: 'MSG91 sender ID for SMS' },
  { group: 'sms', key: 'twilio_account_sid', value: '', isSecret: true, description: 'Twilio account SID for SMS' },
  { group: 'sms', key: 'twilio_auth_token', value: '', isSecret: true, description: 'Twilio auth token for SMS' },
  { group: 'sms', key: 'twilio_from_number', value: '', isSecret: false, description: 'Twilio sender number for SMS' },
  // WhatsApp
  { group: 'whatsapp', key: 'active_provider', value: '', isSecret: false, description: 'Active WhatsApp provider (msg91)' },
  { group: 'whatsapp', key: 'msg91_auth_key', value: '', isSecret: true, description: 'MSG91 auth key for WhatsApp' },
  { group: 'whatsapp', key: 'msg91_number', value: '', isSecret: false, description: 'MSG91 WhatsApp number' },
  // Payment
  { group: 'payment', key: 'active_provider', value: '', isSecret: false, description: 'Active payment provider (razorpay | stripe)' },
  { group: 'payment', key: 'razorpay_key_id', value: '', isSecret: true, description: 'Razorpay key ID' },
  { group: 'payment', key: 'razorpay_key_secret', value: '', isSecret: true, description: 'Razorpay key secret' },
  { group: 'payment', key: 'razorpay_webhook_secret', value: '', isSecret: true, description: 'Razorpay webhook secret' },
  { group: 'payment', key: 'stripe_publishable_key', value: '', isSecret: true, description: 'Stripe publishable key' },
  { group: 'payment', key: 'stripe_secret_key', value: '', isSecret: true, description: 'Stripe secret key' },
  { group: 'payment', key: 'stripe_webhook_secret', value: '', isSecret: true, description: 'Stripe webhook secret' },
  // Push
  { group: 'push', key: 'active_provider', value: '', isSecret: false, description: 'Active push provider (fcm)' },
  { group: 'push', key: 'fcm_server_key', value: '', isSecret: true, description: 'Firebase Cloud Messaging server key' },
  { group: 'push', key: 'fcm_project_id', value: '', isSecret: false, description: 'Firebase project ID' },
  // Storage
  { group: 'storage', key: 'active_provider', value: '', isSecret: false, description: 'Active storage provider (s3 | r2)' },
  { group: 'storage', key: 's3_access_key', value: '', isSecret: true, description: 'AWS S3 access key' },
  { group: 'storage', key: 's3_secret_key', value: '', isSecret: true, description: 'AWS S3 secret key' },
  { group: 'storage', key: 's3_bucket', value: '', isSecret: false, description: 'AWS S3 bucket name' },
  { group: 'storage', key: 's3_region', value: '', isSecret: false, description: 'AWS S3 region' },
  { group: 'storage', key: 'r2_access_key', value: '', isSecret: true, description: 'Cloudflare R2 access key' },
  { group: 'storage', key: 'r2_secret_key', value: '', isSecret: true, description: 'Cloudflare R2 secret key' },
  { group: 'storage', key: 'r2_bucket', value: '', isSecret: false, description: 'Cloudflare R2 bucket name' },
  { group: 'storage', key: 'r2_endpoint', value: '', isSecret: false, description: 'Cloudflare R2 endpoint URL' },
  // Cloudinary (platform default)
  { group: 'cloudinary', key: 'cloud_name', value: 'dakd6siup', isSecret: false, description: 'Cloudinary cloud name' },
  { group: 'cloudinary', key: 'api_key', value: '', isSecret: true, description: 'Cloudinary API key' },
  { group: 'cloudinary', key: 'api_secret', value: '', isSecret: true, description: 'Cloudinary API secret' },
  { group: 'cloudinary', key: 'default_folder', value: '', isSecret: false, description: 'Default upload folder' },
  // OAuth
  { group: 'oauth', key: 'google_client_id', value: '', isSecret: true, description: 'Google OAuth client ID' },
  { group: 'oauth', key: 'google_client_secret', value: '', isSecret: true, description: 'Google OAuth client secret' },
  { group: 'oauth', key: 'github_client_id', value: '', isSecret: true, description: 'GitHub OAuth client ID' },
  { group: 'oauth', key: 'github_client_secret', value: '', isSecret: true, description: 'GitHub OAuth client secret' },
];

export async function seedPlatformConfigs(prisma: PrismaClient): Promise<void> {
  console.log('\nCreating platform configs...');
  for (const config of PLATFORM_CONFIGS) {
    await prisma.platformConfig.upsert({
      where: { group_key: { group: config.group, key: config.key } },
      update: { description: config.description, isSecret: config.isSecret },
      create: { group: config.group, key: config.key, value: config.value, isSecret: config.isSecret, description: config.description },
    });
  }
  console.log(`  ✓ ${PLATFORM_CONFIGS.length} platform config entries`);
}
