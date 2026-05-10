import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const DEMO_PASSWORD = 'Demo@1234';

export async function seedPlayFlixDemo(prisma: PrismaClient) {
  console.log('\n── PlayFlix demo data ──');
  const org = await prisma.organization.findUnique({ where: { slug: 'playflix' } });
  if (!org) { console.log('  ✗ playflix org not found'); return; }

  const pwHash = await hash(DEMO_PASSWORD, 10);

  // Migrate old watchroom demo user if exists
  const oldUser = await prisma.endUser.findFirst({
    where: { orgId: org.id, email: 'demo@watchroom.in' },
  });
  if (oldUser) {
    await prisma.endUser.update({
      where: { id: oldUser.id },
      data: { email: 'demo@playflix.in' },
    });
    console.log('  ✓ Migrated demo@watchroom.in → demo@playflix.in');
  } else {
    await prisma.endUser.upsert({
      where: { orgId_email: { orgId: org.id, email: 'demo@playflix.in' } } as never,
      update: {},
      create: {
        orgId: org.id,
        name: 'Zara Khan',
        email: 'demo@playflix.in',
        phone: '9850005001',
        passwordHash: pwHash,
        isEmailVerified: true,
        status: 'active',
      },
    });
  }
  console.log('  ✓ Demo user: demo@playflix.in');

  // Movie categories
  const movieCat = await prisma.catalogCategory.upsert({
    where: { orgId_slug: { orgId: org.id, slug: 'movies' } },
    update: {},
    create: { orgId: org.id, name: 'Movies', slug: 'movies', rank: 1, isActive: true },
  });
  const seriesCat = await prisma.catalogCategory.upsert({
    where: { orgId_slug: { orgId: org.id, slug: 'series' } },
    update: {},
    create: { orgId: org.id, name: 'Series', slug: 'series', rank: 2, isActive: true },
  });
  console.log('  ✓ 2 categories (Movies, Series)');

  const movies = [
    { slug: 'wr-inception', title: 'Inception', synopsis: 'A thief who steals corporate secrets through dream-sharing technology.', year: 2010, duration: 148, rating: 'UA', lang: ['en'], rent: 59, buy: 149, popularity: 9.8, trending: 9.5 },
    { slug: 'wr-interstellar', title: 'Interstellar', synopsis: 'A team of explorers travel through a wormhole in space.', year: 2014, duration: 169, rating: 'UA', lang: ['en', 'hi'], rent: 59, buy: 149, popularity: 9.7, trending: 8.9 },
    { slug: 'wr-3-idiots', title: '3 Idiots', synopsis: 'Two friends search for their long-lost companion while recounting the events of their college days.', year: 2009, duration: 170, rating: 'U', lang: ['hi'], rent: 39, buy: 99, popularity: 9.6, trending: 7.5 },
    { slug: 'wr-dune', title: 'Dune: Part One', synopsis: 'A noble family becomes embroiled in a war for control over the galaxy\'s most valuable asset.', year: 2021, duration: 155, rating: 'UA', lang: ['en'], rent: 69, buy: 179, popularity: 9.4, trending: 9.2 },
    { slug: 'wr-oppenheimer', title: 'Oppenheimer', synopsis: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.', year: 2023, duration: 180, rating: 'UA', lang: ['en'], rent: 79, buy: 199, popularity: 9.5, trending: 9.8 },
    { slug: 'wr-pathaan', title: 'Pathaan', synopsis: 'An Indian spy takes on the leader of a rogue mercenary organization.', year: 2023, duration: 146, rating: 'UA', lang: ['hi', 'en'], rent: 49, buy: 129, popularity: 8.8, trending: 8.4 },
    { slug: 'wr-the-dark-knight', title: 'The Dark Knight', synopsis: 'Batman raises the stakes in his war on crime with the help of Lieutenant Jim Gordon and DA Harvey Dent.', year: 2008, duration: 152, rating: 'UA', lang: ['en'], rent: 59, buy: 149, popularity: 9.9, trending: 8.0 },
    { slug: 'wr-rrrr', title: 'RRR', synopsis: 'A fictitious story about two legendary revolutionaries and their journey away from home.', year: 2022, duration: 187, rating: 'UA', lang: ['te', 'hi', 'en'], rent: 49, buy: 129, popularity: 9.3, trending: 9.1 },
  ];

  for (const m of movies) {
    const item = await prisma.catalogItem.upsert({
      where: { orgId_slug: { orgId: org.id, slug: m.slug } },
      update: {},
      create: { orgId: org.id, categoryId: movieCat.id, slug: m.slug, isFeatured: (m.popularity ?? 0) > 9.5, inStock: true },
    });
    await prisma.catalogItemVariant.upsert({
      where: { orgId_itemId_variantType: { orgId: org.id, itemId: item.id, variantType: 'standard' } } as never,
      update: {},
      create: { orgId: org.id, itemId: item.id, variantType: 'standard', name: m.title, price: m.rent, isActive: true },
    } as never);
    await prisma.movieDetail.upsert({
      where: { catalogItemId: item.id },
      update: {},
      create: {
        orgId: org.id,
        catalogItemId: item.id,
        title: m.title,
        synopsis: m.synopsis,
        releaseYear: m.year ?? 2020,
        durationMinutes: m.duration ?? 120,
        contentRating: m.rating ?? 'UA',
        languages: m.lang,
        subtitles: ['en'],
        rentPriceInr: m.rent,
        buyPriceInr: m.buy,
        popularityScore: m.popularity ?? 8.0,
        trendingScore: m.trending ?? 7.0,
        moods: ['thriller', 'drama'],
      },
    });
  }
  console.log(`  ✓ ${movies.length} movies with catalog items`);

  // Seed a series/show category item
  const showItem = await prisma.catalogItem.upsert({
    where: { orgId_slug: { orgId: org.id, slug: 'wr-sacred-games' } },
    update: {},
    create: { orgId: org.id, categoryId: seriesCat.id, slug: 'wr-sacred-games', isFeatured: true, inStock: true },
  });
  await prisma.catalogItemVariant.upsert({
    where: { orgId_itemId_variantType: { orgId: org.id, itemId: showItem.id, variantType: 'standard' } } as never,
    update: {},
    create: { orgId: org.id, itemId: showItem.id, variantType: 'standard', name: 'Sacred Games', price: 99, isActive: true },
  } as never);
  await prisma.movieDetail.upsert({
    where: { catalogItemId: showItem.id },
    update: {},
    create: {
      orgId: org.id,
      catalogItemId: showItem.id,
      title: 'Sacred Games',
      synopsis: 'A link in the chain of information leads a police inspector to a fugitive gangster who claims he can save Mumbai.',
      releaseYear: 2018,
      durationMinutes: 55,
      contentRating: 'A',
      languages: ['hi', 'en'],
      subtitles: ['en'],
      rentPriceInr: 99,
      buyPriceInr: 249,
      popularityScore: 9.1,
      trendingScore: 7.8,
      moods: ['thriller', 'crime'],
    },
  });
  console.log('  ✓ 1 series');
}
