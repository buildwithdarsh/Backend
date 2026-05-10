/**
 * Upload Pexels stock images to Cloudinary and update BurgerEmpire catalog items.
 * Run: npx ts-node prisma/seed-images.ts
 */
import { PrismaClient } from '@prisma/client';
import https from 'https';
import crypto from 'crypto';

const prisma = new PrismaClient();

const CLOUD_NAME = process.env['CLOUDINARY_CLOUD_NAME'] || 'dakd6siup';
const API_KEY = process.env['CLOUDINARY_API_KEY'] || '439865593799252';
const API_SECRET = process.env['CLOUDINARY_API_SECRET'] || 'eElw755VAHWuzPeeD07D22e3BUM';

// ─── Pexels image URLs per category slug ──────────────────────────────────────
const CATEGORY_IMAGES: Record<string, string[]> = {
  'pocket-friendly': [
    'https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/18713424/pexels-photo-18713424.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1556698/pexels-photo-1556698.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/13573666/pexels-photo-13573666.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/19247582/pexels-photo-19247582.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/8365318/pexels-photo-8365318.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'burgers': [
    'https://images.pexels.com/photos/10922931/pexels-photo-10922931.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1893557/pexels-photo-1893557.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3630141/pexels-photo-3630141.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2119758/pexels-photo-2119758.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/109400/pexels-photo-109400.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/15818982/pexels-photo-15818982.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/31596401/pexels-photo-31596401.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/11354334/pexels-photo-11354334.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3826273/pexels-photo-3826273.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/461382/pexels-photo-461382.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2983098/pexels-photo-2983098.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2983099/pexels-photo-2983099.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2089717/pexels-photo-2089717.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1556698/pexels-photo-1556698.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/13573666/pexels-photo-13573666.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'sides': [
    'https://images.pexels.com/photos/4955266/pexels-photo-4955266.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2955819/pexels-photo-2955819.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2962450/pexels-photo-2962450.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4109234/pexels-photo-4109234.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/16222103/pexels-photo-16222103.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/27831789/pexels-photo-27831789.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/13795311/pexels-photo-13795311.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6941026/pexels-photo-6941026.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'beverages': [
    'https://images.pexels.com/photos/8880727/pexels-photo-8880727.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/8879626/pexels-photo-8879626.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/7259040/pexels-photo-7259040.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/11136849/pexels-photo-11136849.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2775860/pexels-photo-2775860.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'desserts': [
    'https://images.pexels.com/photos/45202/pexels-photo-45202.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'combos': [
    'https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/179833/pexels-photo-179833.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'wraps-rolls': [
    'https://images.pexels.com/photos/4955266/pexels-photo-4955266.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2955819/pexels-photo-2955819.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/5779423/pexels-photo-5779423.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2454533/pexels-photo-2454533.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1552635/pexels-photo-1552635.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1885578/pexels-photo-1885578.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/19202827/pexels-photo-19202827.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/30700809/pexels-photo-30700809.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4955266/pexels-photo-4955266.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'rice-bowls': [
    'https://images.pexels.com/photos/1306548/pexels-photo-1306548.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/724300/pexels-photo-724300.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/8923092/pexels-photo-8923092.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/28503584/pexels-photo-28503584.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/24738519/pexels-photo-24738519.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6120244/pexels-photo-6120244.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/12737817/pexels-photo-12737817.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4224305/pexels-photo-4224305.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6249394/pexels-photo-6249394.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'pasta': [
    'https://images.pexels.com/photos/1438672/pexels-photo-1438672.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/11161425/pexels-photo-11161425.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/7837671/pexels-photo-7837671.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4039856/pexels-photo-4039856.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/12866988/pexels-photo-12866988.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/9553941/pexels-photo-9553941.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3590401/pexels-photo-3590401.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1487511/pexels-photo-1487511.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6287454/pexels-photo-6287454.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'pizza': [
    'https://images.pexels.com/photos/803290/pexels-photo-803290.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/774487/pexels-photo-774487.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/28962798/pexels-photo-28962798.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/27582711/pexels-photo-27582711.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/708587/pexels-photo-708587.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/263041/pexels-photo-263041.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/29605927/pexels-photo-29605927.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3644/pexels-photo-3644.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1166120/pexels-photo-1166120.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1552635/pexels-photo-1552635.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'sandwiches': [
    'https://images.pexels.com/photos/5292918/pexels-photo-5292918.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/959922/pexels-photo-959922.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/30700809/pexels-photo-30700809.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/33952893/pexels-photo-33952893.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/20400411/pexels-photo-20400411.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/19202827/pexels-photo-19202827.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1885578/pexels-photo-1885578.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/15523391/pexels-photo-15523391.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2725744/pexels-photo-2725744.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'salads': [
    'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3743537/pexels-photo-3743537.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/257816/pexels-photo-257816.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/8251537/pexels-photo-8251537.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/30700804/pexels-photo-30700804.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1105166/pexels-photo-1105166.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/5292918/pexels-photo-5292918.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'momos': [
    'https://images.pexels.com/photos/5409010/pexels-photo-5409010.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/5409017/pexels-photo-5409017.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/11235676/pexels-photo-11235676.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/18803177/pexels-photo-18803177.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/688803/pexels-photo-688803.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/32938715/pexels-photo-32938715.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4224305/pexels-photo-4224305.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4224314/pexels-photo-4224314.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6249394/pexels-photo-6249394.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/7129403/pexels-photo-7129403.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'loaded-fries': [
    'https://images.pexels.com/photos/2962450/pexels-photo-2962450.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4109234/pexels-photo-4109234.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/5695616/pexels-photo-5695616.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/15234683/pexels-photo-15234683.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/8272619/pexels-photo-8272619.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/115740/pexels-photo-115740.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1583891/pexels-photo-1583891.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/17429243/pexels-photo-17429243.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'platters': [
    'https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/179833/pexels-photo-179833.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4109268/pexels-photo-4109268.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4109136/pexels-photo-4109136.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/5093862/pexels-photo-5093862.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3023476/pexels-photo-3023476.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/23996328/pexels-photo-23996328.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/793765/pexels-photo-793765.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'milkshakes-smoothies': [
    'https://images.pexels.com/photos/10066814/pexels-photo-10066814.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3727250/pexels-photo-3727250.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/11299733/pexels-photo-11299733.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3342301/pexels-photo-3342301.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/103566/pexels-photo-103566.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6341422/pexels-photo-6341422.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/775032/pexels-photo-775032.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/12049993/pexels-photo-12049993.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/8330380/pexels-photo-8330380.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/11135665/pexels-photo-11135665.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4099238/pexels-photo-4099238.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
};

// ─── Upload a remote URL to Cloudinary ────────────────────────────────────────
function uploadToCloudinary(imageUrl: string, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const paramsToSign = `overwrite=true&public_id=${publicId}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + API_SECRET)
      .digest('hex');

    const formData = [
      `file=${encodeURIComponent(imageUrl)}`,
      `public_id=${encodeURIComponent(publicId)}`,
      `timestamp=${timestamp}`,
      `api_key=${API_KEY}`,
      `signature=${signature}`,
      `overwrite=true`,
    ].join('&');

    const options = {
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(formData),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.error) reject(new Error(json.error.message));
          else resolve(json.public_id);
        } catch (e) {
          reject(new Error(`Parse error: ${body.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(formData);
    req.end();
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Uploading stock images to Cloudinary & updating DB...\n');

  const org = await prisma.organization.findUnique({ where: { slug: 'burgerempire' } });
  if (!org) { console.error('BurgerEmpire org not found!'); process.exit(1); }

  // Get all items grouped by category
  const items = await prisma.catalogItem.findMany({
    where: { orgId: org.id, deletedAt: null },
    include: { category: true },
    orderBy: { sortOrder: 'asc' },
  });

  console.log(`  Found ${items.length} items\n`);

  let uploaded = 0;
  let updated = 0;

  for (const item of items) {
    const catSlug = item.category?.slug;
    if (!catSlug) continue;

    const images = CATEGORY_IMAGES[catSlug];
    if (!images || images.length === 0) {
      console.log(`  ⚠ No images for category: ${catSlug}`);
      continue;
    }

    // Pick image from pool (round-robin within category)
    const catItems = items.filter((i) => i.category?.slug === catSlug);
    const idx = catItems.indexOf(item);
    const pexelsUrl = images[idx % images.length]!;
    const publicId = `burgerempire/menu/${item.slug}`;

    try {
      await uploadToCloudinary(pexelsUrl, publicId);
      uploaded++;

      // Update all variants for this item
      await prisma.catalogItemVariant.updateMany({
        where: { itemId: item.id },
        data: { imageUrl: publicId },
      });
      updated++;

      console.log(`  ✓ ${item.slug}`);
    } catch (err: any) {
      console.log(`  ✗ ${item.slug}: ${err.message}`);
    }
  }

  console.log(`\n  Uploaded: ${uploaded} images`);
  console.log(`  Updated: ${updated} items in DB`);
  console.log('Done!');
}

main()
  .catch((e) => { console.error('Failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
