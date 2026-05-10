/**
 * Movie seed data for InstaMovieMart.
 * Run via: npx tsx src/modules/movies/seed-movies.ts
 *
 * This creates the instamoviewmart org (if not exists), genre categories,
 * and 20+ movies with credits and hero banners.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ORG_SLUG = 'playflix';
const ORG_NAME = 'PlayFlix';

interface MovieSeed {
  title: string;
  slug: string;
  synopsis: string;
  releaseYear: number;
  durationMinutes: number;
  contentRating: string;
  languages: string[];
  genres: string[];
  moods: string[];
  rentPrice: number;
  buyPrice: number;
  posterUrl: string;
  backdropUrl: string;
  director: { name: string; slug: string };
  cast: Array<{ name: string; slug: string; character: string }>;
  popularityScore: number;
  trendingScore: number;
}

const MOVIES: MovieSeed[] = [
  {
    title: 'Pushpa 2: The Rule',
    slug: 'pushpa-2-the-rule',
    synopsis: 'Pushpa Raj returns to take on the syndicate and the police force in this action-packed sequel that continues where the first part left off.',
    releaseYear: 2024,
    durationMinutes: 178,
    contentRating: 'UA',
    languages: ['Hindi', 'Telugu', 'Tamil'],
    genres: ['Action', 'Drama'],
    moods: ['intense'],
    rentPrice: 149,
    buyPrice: 399,
    posterUrl: 'https://image.tmdb.org/t/p/w342/bGaBpMFBk5MHRwRlCHnSE0xP3mX.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/bGaBpMFBk5MHRwRlCHnSE0xP3mX.jpg',
    director: { name: 'Sukumar', slug: 'sukumar' },
    cast: [
      { name: 'Allu Arjun', slug: 'allu-arjun', character: 'Pushpa Raj' },
      { name: 'Rashmika Mandanna', slug: 'rashmika-mandanna', character: 'Srivalli' },
      { name: 'Fahadh Faasil', slug: 'fahadh-faasil', character: 'SP Bhanwar Singh Shekhawat' },
    ],
    popularityScore: 95,
    trendingScore: 98,
  },
  {
    title: 'Oppenheimer',
    slug: 'oppenheimer',
    synopsis: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    releaseYear: 2023,
    durationMinutes: 180,
    contentRating: 'A',
    languages: ['English', 'Hindi'],
    genres: ['Drama', 'Thriller'],
    moods: ['mind-bending', 'intense'],
    rentPrice: 79,
    buyPrice: 299,
    posterUrl: 'https://image.tmdb.org/t/p/w342/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    director: { name: 'Christopher Nolan', slug: 'christopher-nolan' },
    cast: [
      { name: 'Cillian Murphy', slug: 'cillian-murphy', character: 'J. Robert Oppenheimer' },
      { name: 'Emily Blunt', slug: 'emily-blunt', character: 'Kitty Oppenheimer' },
      { name: 'Robert Downey Jr.', slug: 'robert-downey-jr', character: 'Lewis Strauss' },
    ],
    popularityScore: 92,
    trendingScore: 75,
  },
  {
    title: 'Jawan',
    slug: 'jawan',
    synopsis: 'A man is driven by a personal vendetta to rectify the wrongs in society, while being protected by his family of strong women.',
    releaseYear: 2023,
    durationMinutes: 169,
    contentRating: 'UA',
    languages: ['Hindi', 'Tamil', 'Telugu'],
    genres: ['Action', 'Thriller'],
    moods: ['intense', 'feel-good'],
    rentPrice: 99,
    buyPrice: 349,
    posterUrl: 'https://image.tmdb.org/t/p/w342/jBGQ5sFpXHj8kXTjwa4bNjIlOqE.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/jBGQ5sFpXHj8kXTjwa4bNjIlOqE.jpg',
    director: { name: 'Atlee', slug: 'atlee' },
    cast: [
      { name: 'Shah Rukh Khan', slug: 'shah-rukh-khan', character: 'Vikram Rathore' },
      { name: 'Nayanthara', slug: 'nayanthara', character: 'Narmada Rai' },
      { name: 'Vijay Sethupathi', slug: 'vijay-sethupathi', character: 'Kalee' },
    ],
    popularityScore: 90,
    trendingScore: 70,
  },
  {
    title: 'Animal',
    slug: 'animal',
    synopsis: 'A son undergoes a remarkable transformation when the safety of his father is threatened, unleashing a dark and violent side.',
    releaseYear: 2023,
    durationMinutes: 201,
    contentRating: 'A',
    languages: ['Hindi'],
    genres: ['Action', 'Drama'],
    moods: ['intense'],
    rentPrice: 99,
    buyPrice: 349,
    posterUrl: 'https://image.tmdb.org/t/p/w342/kg1un5p0ZkxOAMZMOjQKfMLMVol.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/kg1un5p0ZkxOAMZMOjQKfMLMVol.jpg',
    director: { name: 'Sandeep Reddy Vanga', slug: 'sandeep-reddy-vanga' },
    cast: [
      { name: 'Ranbir Kapoor', slug: 'ranbir-kapoor', character: 'Ranvijay' },
      { name: 'Rashmika Mandanna', slug: 'rashmika-mandanna', character: 'Geetanjali' },
      { name: 'Anil Kapoor', slug: 'anil-kapoor', character: 'Balbir' },
    ],
    popularityScore: 88,
    trendingScore: 65,
  },
  {
    title: 'Dune: Part Two',
    slug: 'dune-part-two',
    synopsis: 'Paul Atreides unites with the Fremen to take revenge against the conspirators who destroyed his family.',
    releaseYear: 2024,
    durationMinutes: 166,
    contentRating: 'UA',
    languages: ['English', 'Hindi'],
    genres: ['Sci-Fi', 'Action'],
    moods: ['intense', 'mind-bending'],
    rentPrice: 79,
    buyPrice: 299,
    posterUrl: 'https://image.tmdb.org/t/p/w342/8b8R8l88Qje9dn9OE8PY05Nez7S.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/8b8R8l88Qje9dn9OE8PY05Nez7S.jpg',
    director: { name: 'Denis Villeneuve', slug: 'denis-villeneuve' },
    cast: [
      { name: 'Timothee Chalamet', slug: 'timothee-chalamet', character: 'Paul Atreides' },
      { name: 'Zendaya', slug: 'zendaya', character: 'Chani' },
      { name: 'Austin Butler', slug: 'austin-butler', character: 'Feyd-Rautha' },
    ],
    popularityScore: 91,
    trendingScore: 85,
  },
  {
    title: 'Rocky Aur Rani Kii Prem Kahaani',
    slug: 'rocky-aur-rani-kii-prem-kahaani',
    synopsis: 'Rocky and Rani come from two very different backgrounds but find love, navigating family drama and cultural clashes.',
    releaseYear: 2023,
    durationMinutes: 168,
    contentRating: 'UA',
    languages: ['Hindi'],
    genres: ['Romance', 'Comedy'],
    moods: ['feel-good', 'romantic'],
    rentPrice: 79,
    buyPrice: 249,
    posterUrl: 'https://image.tmdb.org/t/p/w342/1B3hPOSVBMaN0UH4BKNMM2zFfpZ.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/1B3hPOSVBMaN0UH4BKNMM2zFfpZ.jpg',
    director: { name: 'Karan Johar', slug: 'karan-johar' },
    cast: [
      { name: 'Ranveer Singh', slug: 'ranveer-singh', character: 'Rocky' },
      { name: 'Alia Bhatt', slug: 'alia-bhatt', character: 'Rani' },
      { name: 'Dharmendra', slug: 'dharmendra', character: 'Rocky\'s Grandfather' },
    ],
    popularityScore: 78,
    trendingScore: 45,
  },
  {
    title: 'Stree 2',
    slug: 'stree-2',
    synopsis: 'The residents of Chanderi face a new threat as a headless entity terrorizes the town, and they must once again rely on Stree for protection.',
    releaseYear: 2024,
    durationMinutes: 150,
    contentRating: 'UA',
    languages: ['Hindi'],
    genres: ['Comedy', 'Horror'],
    moods: ['scary', 'feel-good'],
    rentPrice: 99,
    buyPrice: 299,
    posterUrl: 'https://image.tmdb.org/t/p/w342/vpnVM9B6NMmQpWeZvzLbVelHREG.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/vpnVM9B6NMmQpWeZvzLbVelHREG.jpg',
    director: { name: 'Amar Kaushik', slug: 'amar-kaushik' },
    cast: [
      { name: 'Rajkummar Rao', slug: 'rajkummar-rao', character: 'Vicky' },
      { name: 'Shraddha Kapoor', slug: 'shraddha-kapoor', character: 'Stree' },
      { name: 'Pankaj Tripathi', slug: 'pankaj-tripathi', character: 'Rudra' },
    ],
    popularityScore: 86,
    trendingScore: 90,
  },
  {
    title: 'Kalki 2898 AD',
    slug: 'kalki-2898-ad',
    synopsis: 'In a dystopian future, a bounty hunter, a warrior and a woman carrying hope set out on a journey through dark times.',
    releaseYear: 2024,
    durationMinutes: 181,
    contentRating: 'UA',
    languages: ['Hindi', 'Telugu', 'Tamil'],
    genres: ['Sci-Fi', 'Action'],
    moods: ['intense', 'mind-bending'],
    rentPrice: 149,
    buyPrice: 399,
    posterUrl: 'https://image.tmdb.org/t/p/w342/sACu4XIiCUzDFjoWLyaeFmF3QHi.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/sACu4XIiCUzDFjoWLyaeFmF3QHi.jpg',
    director: { name: 'Nag Ashwin', slug: 'nag-ashwin' },
    cast: [
      { name: 'Prabhas', slug: 'prabhas', character: 'Bhairava' },
      { name: 'Amitabh Bachchan', slug: 'amitabh-bachchan', character: 'Ashwatthama' },
      { name: 'Deepika Padukone', slug: 'deepika-padukone', character: 'SU-M80' },
    ],
    popularityScore: 89,
    trendingScore: 88,
  },
];

async function main() {
  console.log('Seeding PlayFlix...');

  // 1. Create or rename org
  let org = await prisma.organization.findUnique({ where: { slug: ORG_SLUG } });
  if (!org) {
    // Check if old org exists and rename it
    const oldOrg = await prisma.organization.findUnique({ where: { slug: 'watchroom' } })
      ?? await prisma.organization.findUnique({ where: { slug: 'instamoviewmart' } });
    if (oldOrg) {
      org = await prisma.organization.update({
        where: { id: oldOrg.id },
        data: { name: ORG_NAME, slug: ORG_SLUG },
      });
      console.log(`Renamed org instamoviewmart → ${ORG_SLUG}: ${org.id}`);
    } else {
      const { randomBytes } = await import('node:crypto');
      org = await prisma.organization.create({
        data: {
          name: ORG_NAME,
          slug: ORG_SLUG,
          storefrontKey: `tz_${randomBytes(16).toString('hex')}`,
          status: 'active',
        },
      });
      console.log(`Created org: ${org.id}`);
    }
  } else {
    // Ensure name is updated
    if (org.name !== ORG_NAME) {
      org = await prisma.organization.update({ where: { id: org.id }, data: { name: ORG_NAME } });
    }
    console.log(`Org already exists: ${org.id}`);
  }

  // 2. Create OrgSettings
  const existingSettings = await prisma.orgSettings.findFirst({ where: { orgId: org.id } });
  if (!existingSettings) {
    await prisma.orgSettings.create({
      data: {
        orgId: org.id,
        group: 'auth',
        key: 'primary_login_id',
        value: 'phone',
      },
    });
    console.log('Created OrgSettings');
  }

  // 3. Create genre categories
  const genreNames = [...new Set(MOVIES.flatMap((m) => m.genres))];
  const genreMap = new Map<string, string>();

  for (const name of genreNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let cat = await prisma.catalogCategory.findUnique({
      where: { orgId_slug: { orgId: org.id, slug } },
    });
    if (!cat) {
      cat = await prisma.catalogCategory.create({
        data: { orgId: org.id, name, slug, rank: genreNames.indexOf(name) },
      });
    }
    genreMap.set(name, cat.id);
  }
  console.log(`Genres: ${genreNames.join(', ')}`);

  // 4. Create movies
  for (const m of MOVIES) {
    const existing = await prisma.catalogItem.findUnique({
      where: { orgId_slug: { orgId: org.id, slug: m.slug } },
    });
    if (existing) {
      console.log(`  Skip (exists): ${m.title}`);
      continue;
    }

    const categoryId = genreMap.get(m.genres[0]!)!;

    // CatalogItem
    const item = await prisma.catalogItem.create({
      data: {
        orgId: org.id,
        categoryId,
        slug: m.slug,
        tags: m.genres.map((g) => g.toLowerCase()),
        isFeatured: m.popularityScore > 90,
        metadata: { type: 'movie' },
      },
    });

    // Variants
    await prisma.catalogItemVariant.create({
      data: {
        orgId: org.id,
        itemId: item.id,
        variantType: 'rent',
        name: `Rent (48h)`,
        price: m.rentPrice,
        isActive: true,
      },
    });
    await prisma.catalogItemVariant.create({
      data: {
        orgId: org.id,
        itemId: item.id,
        variantType: 'buy',
        name: 'Buy (Own Forever)',
        price: m.buyPrice,
        isActive: true,
      },
    });

    // MovieDetail
    const movie = await prisma.movieDetail.create({
      data: {
        orgId: org.id,
        catalogItemId: item.id,
        title: m.title,
        synopsis: m.synopsis,
        releaseYear: m.releaseYear,
        durationMinutes: m.durationMinutes,
        contentRating: m.contentRating,
        languages: m.languages,
        subtitles: ['English'],
        posterUrl: m.posterUrl,
        backdropUrl: m.backdropUrl,
        rentPriceInr: m.rentPrice,
        buyPriceInr: m.buyPrice,
        moods: m.moods,
        popularityScore: m.popularityScore,
        trendingScore: m.trendingScore,
      },
    });

    // Credits
    const credits = [
      { ...m.director, role: 'director', character: null, sortOrder: 0 },
      ...m.cast.map((c, i) => ({ name: c.name, slug: c.slug, role: 'actor', character: c.character, sortOrder: i + 1 })),
    ];

    await prisma.movieCredit.createMany({
      data: credits.map((c) => ({
        orgId: org.id,
        movieDetailId: movie.id,
        personName: c.name,
        personSlug: c.slug,
        role: c.role,
        character: c.character,
        sortOrder: c.sortOrder,
      })),
    });

    console.log(`  Created: ${m.title}`);
  }

  // 5. Create hero banners for top 3 movies
  const topMovies = await prisma.movieDetail.findMany({
    where: { orgId: org.id },
    orderBy: { trendingScore: 'desc' },
    take: 3,
    include: { catalogItem: { select: { slug: true } } },
  });

  for (let i = 0; i < topMovies.length; i++) {
    const m = topMovies[i]!;
    const existing = await prisma.heroBanner.findFirst({
      where: { orgId: org.id, movieDetailId: m.id },
    });
    if (!existing) {
      await prisma.heroBanner.create({
        data: {
          orgId: org.id,
          movieDetailId: m.id,
          title: m.title,
          subtitle: `Rent from ₹${m.rentPriceInr}`,
          imageUrl: m.backdropUrl || m.posterUrl || '',
          sortOrder: i,
        },
      });
    }
  }

  // 6. Seed sample WatchRooms (live rooms for demo)
  const endUser = await prisma.endUser.findFirst({ where: { orgId: org.id } });
  if (endUser) {
    const sampleMovies = await prisma.movieDetail.findMany({
      where: { orgId: org.id },
      orderBy: { trendingScore: 'desc' },
      take: 3,
    });

    for (const movie of sampleMovies) {
      const existingRoom = await prisma.playFlixRoom.findFirst({
        where: { orgId: org.id, tmdbId: movie.id ? 0 : 0, status: 'live' },
      });
      if (!existingRoom) {
        await prisma.playFlixRoom.create({
          data: {
            orgId: org.id,
            hostId: endUser.id,
            tmdbId: movie.releaseYear || 0,
            movieTitle: movie.title,
            posterUrl: movie.posterUrl,
            gdriveFileId: 'demo-file-id',
            name: `${movie.title} Night`,
            privacy: 'public',
            vibe: 'chill',
            ratePerMinPaise: 50,
            maxViewers: 50,
            viewerCount: Math.floor(Math.random() * 30) + 5,
            status: 'live',
            startedAt: new Date(),
          },
        });
        console.log(`  Created room: ${movie.title} Night`);
      }
    }
  }

  console.log(`\nDone! Seeded ${MOVIES.length} movies for ${ORG_NAME}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
