import { PrismaClient } from '@prisma/client';
import { seedOrganization, OrgSettingEntry } from '../Shared';

const PLAYFLIX_SETTINGS: OrgSettingEntry[] = [
  // Branding
  { group: 'branding', key: 'name', value: '"PlayFlix"', type: 'string', label: 'Platform display name' },
  { group: 'branding', key: 'tagline', value: '"Stream Together"', type: 'string', label: 'Tagline' },
  { group: 'branding', key: 'currency', value: '"INR"', type: 'string', label: 'Currency code' },
  { group: 'branding', key: 'currency_symbol', value: '"₹"', type: 'string', label: 'Currency symbol' },
  { group: 'branding', key: 'timezone', value: '"Asia/Kolkata"', type: 'string', label: 'Timezone' },
  { group: 'branding', key: 'logo_url', value: '""', type: 'string', label: 'Logo URL' },
  { group: 'branding', key: 'primary_color', value: '"#E8004D"', type: 'string', label: 'Primary brand color (crimson)' },
  { group: 'branding', key: 'secondary_color', value: '"#141414"', type: 'string', label: 'Secondary brand color (dark)' },
  // Features
  { group: 'features', key: 'watchrooms_enabled', value: 'true', type: 'boolean', label: 'PlayFlix rooms (co-viewing) enabled' },
  { group: 'features', key: 'reviews_enabled', value: 'true', type: 'boolean', label: 'Movie reviews enabled' },
  { group: 'features', key: 'watchlist_enabled', value: 'true', type: 'boolean', label: 'Watchlist enabled' },
  { group: 'features', key: 'host_earnings_enabled', value: 'true', type: 'boolean', label: 'Host earnings enabled' },
  // Streaming
  { group: 'streaming', key: 'provider', value: '"vimeo"', type: 'string', label: 'Streaming provider' },
  { group: 'streaming', key: 'max_viewers_per_room', value: '10', type: 'number', label: 'Max viewers per room' },
  { group: 'streaming', key: 'room_timeout_minutes', value: '180', type: 'number', label: 'Room auto-close timeout (minutes)' },
  // Auth
  { group: 'auth', key: 'primary_login_id', value: '"email"', type: 'string', label: 'Primary login identifier' },
  { group: 'auth', key: 'otp_length', value: '6', type: 'number', label: 'OTP length' },
];

export async function seedPlayFlixOrg(
  prisma: PrismaClient,
  plans: Array<{ id: string; slug: string }>,
  superAdminPassword: string,
) {
  console.log('\n--- Onboarding PlayFlix ---');

  // Rename old watchroom org if it exists
  const oldOrg = await prisma.organization.findUnique({ where: { slug: 'watchroom' } });
  if (oldOrg) {
    console.log('  Renaming old watchroom org to playflix...');
    await prisma.organization.update({
      where: { id: oldOrg.id },
      data: { name: 'PlayFlix', slug: 'playflix' },
    });
  }

  const org = await seedOrganization(prisma, {
    name: 'PlayFlix',
    slug: 'playflix',
    planSlug: 'pro',
    adminEmail: 'playflix@techzunction.com',
    adminName: 'PlayFlix Admin',
    adminPassword: superAdminPassword,
    storefrontKey: 'tz_cb4eef9e679a9efbaefc132981bb408e',
    settings: PLAYFLIX_SETTINGS,
    plans,
  });

  return org;
}
