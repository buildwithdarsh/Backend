import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const DEMO_PASSWORD = 'Demo@1234';
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);

export async function seedPlayFlixRichDemo(prisma: PrismaClient) {
  console.log('\n── PlayFlix rich demo user ──');
  const org = await prisma.organization.findUnique({ where: { slug: 'playflix' } });
  if (!org) { console.log('  ✗ playflix org not found'); return; }

  // Get the demo user (created by demo.ts seed)
  const pwHash = await hash(DEMO_PASSWORD, 10);
  const user = await prisma.endUser.upsert({
    where: { orgId_email: { orgId: org.id, email: 'demo@playflix.in' } } as never,
    update: {},
    create: {
      orgId: org.id,
      name: 'Zara Khan',
      email: 'demo@playflix.in',
      phone: '9850005002',
      passwordHash: pwHash,
      isEmailVerified: true,
      status: 'active',
    },
  });
  console.log(`  ✓ Demo user: ${user.email}`);

  // Get movie details and catalog items
  const movieDetails = await prisma.movieDetail.findMany({ where: { orgId: org.id }, include: { catalogItem: true } });
  if (movieDetails.length === 0) { console.log('  ✗ No movies found — run demo seed first'); return; }

  // 1. Wallet Balance (₹500 = 50000 paise)
  await prisma.walletBalance.upsert({
    where: { orgId_endUserId: { orgId: org.id, endUserId: user.id } },
    update: { balancePaise: 50000 },
    create: { orgId: org.id, endUserId: user.id, balancePaise: 50000 },
  });
  console.log('  ✓ Wallet balance (₹500)');

  // 2. Wallet Transactions (5)
  let balance = 50000;
  const walletTxns = [
    { type: 'topup', amount: 30000, desc: 'Added ₹300 via Razorpay' },
    { type: 'debit', amount: -5000, desc: 'Watched Inception (PPM)' },
    { type: 'topup', amount: 50000, desc: 'Added ₹500 via Razorpay' },
    { type: 'debit', amount: -8000, desc: 'Watched Interstellar (PPM)' },
    { type: 'debit', amount: -17000, desc: 'Hosted PlayFlix Room: Oppenheimer Night' },
  ];
  for (let i = 0; i < walletTxns.length; i++) {
    const tx = walletTxns[i]!;
    balance += tx.amount;
    await prisma.walletTransaction.create({
      data: {
        orgId: org.id,
        endUserId: user.id,
        type: tx.type,
        amountPaise: Math.abs(tx.amount),
        balanceAfterPaise: balance,
        description: tx.desc,
        createdAt: daysAgo(30 - i * 5),
      },
    });
  }
  console.log('  ✓ 5 wallet transactions');

  // 3. Movie Entitlements (6 — 3 bought, 3 rented)
  for (let i = 0; i < Math.min(6, movieDetails.length); i++) {
    const movie = movieDetails[i]!;
    const isBuy = i < 3;
    await prisma.movieEntitlement.create({
      data: {
        orgId: org.id,
        endUserId: user.id,
        movieDetailId: movie.id,
        type: isBuy ? 'buy' : 'rent',
        status: i === 5 ? 'expired' : 'active',
        expiresAt: isBuy ? null : (i === 5 ? daysAgo(2) : new Date(Date.now() + 48 * 3600_000)),
        maxPlays: isBuy ? null : 3,
        playCount: isBuy ? (i + 1) : (i === 5 ? 3 : 1),
        pricePaidInr: isBuy ? movie.buyPriceInr! : movie.rentPriceInr!,
      },
    });
  }
  console.log('  ✓ 6 movie entitlements (3 bought, 3 rented)');

  // 4. Watch Progress (on up to 7 movies)
  for (let i = 0; i < Math.min(7, movieDetails.length); i++) {
    const movie = movieDetails[i]!;
    const durationSec = (movie.durationMinutes ?? 120) * 60;
    const completed = i < 3;
    const progressSec = completed ? durationSec : Math.floor(durationSec * (0.1 + Math.random() * 0.7));
    await prisma.watchProgress.upsert({
      where: { orgId_endUserId_movieDetailId: { orgId: org.id, endUserId: user.id, movieDetailId: movie.id } },
      update: { progressSec, completed },
      create: { orgId: org.id, endUserId: user.id, movieDetailId: movie.id, progressSec, durationSec, completed },
    });
  }
  console.log('  ✓ Watch progress on movies');

  // 5. Watchlist (5 items)
  const catalogItems = await prisma.catalogItem.findMany({ where: { orgId: org.id }, take: 8 });
  for (let i = 3; i < Math.min(8, catalogItems.length); i++) {
    await prisma.watchlist.upsert({
      where: { orgId_endUserId_catalogItemId: { orgId: org.id, endUserId: user.id, catalogItemId: catalogItems[i]!.id } },
      update: {},
      create: { orgId: org.id, endUserId: user.id, catalogItemId: catalogItems[i]!.id },
    });
  }
  console.log('  ✓ Watchlist items');

  // 6. Watch Sessions (3 PPM sessions, all ended)
  const sessionMovies = movieDetails.slice(0, 3);
  const sessions: string[] = [];
  for (let i = 0; i < sessionMovies.length; i++) {
    const movie = sessionMovies[i]!;
    const mins = 30 + i * 20;
    const rate = 200; // ₹2/min
    const cap = 15000; // ₹150 cap
    const billed = Math.min(mins * rate, cap);
    const session = await prisma.watchSession.create({
      data: {
        orgId: org.id,
        endUserId: user.id,
        tmdbId: 100000 + i,
        movieTitle: movie.title,
        ratePerMinPaise: rate,
        meterCapPaise: cap,
        totalBilledPaise: billed,
        minutesBilled: mins,
        status: 'ended',
        rating: 3 + i,
        startedAt: daysAgo(20 - i * 7),
        lastBilledAt: daysAgo(20 - i * 7),
        endedAt: daysAgo(20 - i * 7),
      },
    });
    sessions.push(session.id);
  }
  console.log('  ✓ 3 watch sessions (PPM)');

  // 7. WatchRooms (2 — 1 ended, 1 waiting)
  const rooms: string[] = [];
  const roomConfigs = [
    { name: 'Oppenheimer Night 🍿', movie: movieDetails[4] ?? movieDetails[0]!, status: 'ended' as const, viewerCount: 5 },
    { name: 'Weekend Chill: RRR', movie: movieDetails[movieDetails.length - 1] ?? movieDetails[0]!, status: 'waiting' as const, viewerCount: 0 },
  ];
  for (const cfg of roomConfigs) {
    const room = await prisma.playFlixRoom.create({
      data: {
        orgId: org.id,
        hostId: user.id,
        tmdbId: 200000 + rooms.length,
        movieTitle: cfg.movie.title,
        gdriveFileId: `demo_gdrive_${rooms.length}`,
        name: cfg.name,
        privacy: 'public',
        vibe: rooms.length === 0 ? 'serious' : 'chill',
        ratePerMinPaise: 200,
        maxViewers: 50,
        viewerCount: cfg.viewerCount,
        status: cfg.status,
        startedAt: cfg.status === 'ended' ? daysAgo(7) : null,
        endedAt: cfg.status === 'ended' ? daysAgo(7) : null,
      },
    });
    rooms.push(room.id);
  }
  console.log('  ✓ 2 watch rooms (1 ended, 1 waiting)');

  // 8. Host Earning for ended room
  if (rooms[0]) {
    await prisma.hostEarning.create({
      data: {
        orgId: org.id,
        roomId: rooms[0],
        hostId: user.id,
        totalViewerMinutes: 250,
        grossPaise: 50000,
        hostSharePaise: 35000,
        platformSharePaise: 15000,
        status: 'paid',
      },
    });
    console.log('  ✓ 1 host earning (₹350)');
  }

  // 9. Reviews on movies (3)
  const reviewData = [
    { rating: 5, title: 'Nolan\'s masterpiece', body: 'Inception blew my mind. Watched it twice on PlayFlix with friends — the reactions were priceless. The PPM model is genius for movie nights.' },
    { rating: 5, title: 'Interstellar hits different', body: 'Cried at the docking scene. Again. This time with 8 people on PlayFlix. Group watch experience is everything.' },
    { rating: 4, title: 'Great movie, buffering issues', body: '3 Idiots is timeless but had some buffering during peak hours. Sound quality was great though.' },
  ];
  for (let i = 0; i < reviewData.length; i++) {
    const r = reviewData[i]!;
    const movie = movieDetails[i]!;
    await prisma.review.create({
      data: {
        orgId: org.id,
        endUserId: user.id,
        catalogItemId: movie.catalogItemId,
        rating: r.rating,
        title: r.title,
        body: r.body,
        status: 'approved',
        isVerified: true,
        createdAt: daysAgo(i * 10 + 2),
      },
    });
  }
  console.log('  ✓ 3 movie reviews');

  console.log('  ✅ PlayFlix rich demo user seeded');
}
