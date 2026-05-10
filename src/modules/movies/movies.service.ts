import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { QueryMoviesDto, CreateMovieDto } from './dto/index.js';

@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Storefront (Public) ────────────────────────────────────────────────────

  async findAll(orgId: string, query: QueryMoviesDto) {
    const { search, genre, language, mood, sort, page = 1, limit = 20 } = query;

    const where: Prisma.MovieDetailWhereInput = { orgId };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { originalTitle: { contains: search, mode: 'insensitive' } },
        { credits: { some: { personName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    if (genre) {
      where.catalogItem = { category: { slug: genre } };
    }

    if (language) {
      where.languages = { has: language };
    }

    if (mood) {
      where.moods = { has: mood };
    }

    const orderBy: Prisma.MovieDetailOrderByWithRelationInput =
      sort === 'trending' ? { trendingScore: 'desc' } :
      sort === 'popular' ? { popularityScore: 'desc' } :
      sort === 'newest' ? { releaseYear: 'desc' } :
      sort === 'price_low' ? { rentPriceInr: 'asc' } :
      sort === 'price_high' ? { rentPriceInr: 'desc' } :
      { popularityScore: 'desc' };

    const [movies, total] = await Promise.all([
      this.prisma.movieDetail.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          catalogItem: { select: { slug: true, avgRating: true, reviewCount: true, tags: true, isFeatured: true } },
        },
      }),
      this.prisma.movieDetail.count({ where }),
    ]);

    return {
      data: movies,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findBySlug(orgId: string, slug: string) {
    const movie = await this.prisma.movieDetail.findFirst({
      where: {
        orgId,
        catalogItem: { slug, deletedAt: null },
      },
      include: {
        catalogItem: {
          select: { id: true, slug: true, avgRating: true, reviewCount: true, tags: true, categoryId: true },
        },
        credits: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!movie) throw new NotFoundException('Movie not found');

    // Get similar movies (same genre, different movie)
    const similar = await this.prisma.movieDetail.findMany({
      where: {
        orgId,
        id: { not: movie.id },
        catalogItem: { categoryId: movie.catalogItem.categoryId },
      },
      take: 6,
      orderBy: { popularityScore: 'desc' },
      include: {
        catalogItem: { select: { slug: true, avgRating: true } },
      },
    });

    return { ...movie, similar };
  }

  async getHeroBanners(orgId: string) {
    const now = new Date();
    return this.prisma.heroBanner.findMany({
      where: {
        orgId,
        isActive: true,
        OR: [
          { startsAt: null, endsAt: null },
          { startsAt: { lte: now }, endsAt: { gte: now } },
          { startsAt: { lte: now }, endsAt: null },
          { startsAt: null, endsAt: { gte: now } },
        ],
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        movieDetail: {
          select: {
            id: true, title: true, rentPriceInr: true,
            catalogItem: { select: { slug: true } },
          },
        },
      },
    });
  }

  async getGenres(orgId: string) {
    return this.prisma.catalogCategory.findMany({
      where: { orgId, isActive: true, deletedAt: null },
      orderBy: { rank: 'asc' },
      select: { id: true, name: true, slug: true, imageUrl: true },
    });
  }

  // ─── Storefront (Authenticated) ────────────────────────────────────────────

  async getUserLibrary(orgId: string, endUserId: string) {
    const entitlements = await this.prisma.movieEntitlement.findMany({
      where: { orgId, endUserId },
      orderBy: { createdAt: 'desc' },
      include: {
        movieDetail: {
          select: {
            id: true, title: true, posterUrl: true, durationMinutes: true,
            rentalHours: true, rentalMaxPlays: true,
            catalogItem: { select: { slug: true, avgRating: true } },
          },
        },
      },
    });

    return entitlements;
  }

  async checkEntitlement(orgId: string, endUserId: string, movieDetailId: string) {
    const entitlement = await this.prisma.movieEntitlement.findFirst({
      where: {
        orgId,
        endUserId,
        movieDetailId,
        status: 'active',
        OR: [
          { type: 'buy' },
          { type: 'rent', expiresAt: { gte: new Date() } },
        ],
      },
    });

    return entitlement;
  }

  async getStreamUrl(orgId: string, endUserId: string, movieDetailId: string) {
    const entitlement = await this.checkEntitlement(orgId, endUserId, movieDetailId);
    if (!entitlement) throw new ForbiddenException('No active entitlement for this movie');

    // Increment play count for rentals
    if (entitlement.type === 'rent') {
      if (entitlement.maxPlays && entitlement.playCount >= entitlement.maxPlays) {
        throw new ForbiddenException('Maximum plays exceeded for this rental');
      }
      await this.prisma.movieEntitlement.update({
        where: { id: entitlement.id },
        data: { playCount: { increment: 1 } },
      });
    }

    const movie = await this.prisma.movieDetail.findUnique({
      where: { id: movieDetailId },
      select: { streamUrl: true, title: true },
    });

    return { streamUrl: movie?.streamUrl, title: movie?.title };
  }

  async updateWatchProgress(
    orgId: string,
    endUserId: string,
    movieDetailId: string,
    progressSec: number,
    durationSec: number,
  ) {
    return this.prisma.watchProgress.upsert({
      where: { orgId_endUserId_movieDetailId: { orgId, endUserId, movieDetailId } },
      update: { progressSec, durationSec, completed: progressSec >= durationSec * 0.95 },
      create: { orgId, endUserId, movieDetailId, progressSec, durationSec },
    });
  }

  // ─── Watchlist ──────────────────────────────────────────────────────────────

  async getWatchlist(orgId: string, endUserId: string) {
    return this.prisma.watchlist.findMany({
      where: { orgId, endUserId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addToWatchlist(orgId: string, endUserId: string, catalogItemId: string) {
    return this.prisma.watchlist.upsert({
      where: { orgId_endUserId_catalogItemId: { orgId, endUserId, catalogItemId } },
      update: {},
      create: { orgId, endUserId, catalogItemId },
    });
  }

  async removeFromWatchlist(orgId: string, endUserId: string, catalogItemId: string) {
    return this.prisma.watchlist.deleteMany({
      where: { orgId, endUserId, catalogItemId },
    });
  }

  // ─── Entitlements ───────────────────────────────────────────────────────────

  async createEntitlement(
    orgId: string,
    endUserId: string,
    movieDetailId: string,
    type: 'rent' | 'buy',
    pricePaidInr: number,
  ) {
    const movie = await this.prisma.movieDetail.findFirst({
      where: { orgId, id: movieDetailId },
    });

    if (!movie) throw new NotFoundException('Movie not found');

    const data: Prisma.MovieEntitlementCreateInput = {
      organization: { connect: { id: orgId } },
      endUser: { connect: { id: endUserId } },
      movieDetail: { connect: { id: movieDetailId } },
      type,
      pricePaidInr,
      status: 'active',
    };

    if (type === 'rent') {
      data.expiresAt = new Date(Date.now() + (movie.rentalHours || 48) * 60 * 60 * 1000);
      data.maxPlays = movie.rentalMaxPlays || 3;
    }

    return this.prisma.movieEntitlement.create({ data });
  }

  // ─── Stream Mappings (TMDB → GDrive) ───────────────────────────────────────

  async getStreamMapping(tmdbId: number) {
    // Use raw SQL because Prisma Accelerate may have stale schema cache
    const results = await this.prisma.$queryRaw<Array<{
      gdrive_file_id: string;
      title: string;
      enabled: boolean;
    }>>`SELECT gdrive_file_id, title, enabled FROM movie_stream_mappings WHERE tmdb_id = ${tmdbId} AND enabled = true LIMIT 1`;

    if (results.length === 0) return null;
    return { gdriveFileId: results[0]!.gdrive_file_id, title: results[0]!.title };
  }

  async getMappedTmdbIds(tmdbIds: number[]): Promise<Set<number>> {
    if (tmdbIds.length === 0) return new Set();
    const results = await this.prisma.$queryRawUnsafe<Array<{ tmdb_id: number }>>(
      `SELECT tmdb_id FROM movie_stream_mappings WHERE tmdb_id = ANY($1::int[]) AND enabled = true`,
      tmdbIds,
    );
    return new Set(results.map((r) => r.tmdb_id));
  }

  async getAllStreamMappings(orgId: string) {
    return this.prisma.movieStreamMapping.findMany({
      where: { orgId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async upsertStreamMapping(orgId: string, tmdbId: number, data: { title: string; gdriveFileId: string; source?: string }) {
    return this.prisma.movieStreamMapping.upsert({
      where: { orgId_tmdbId: { orgId, tmdbId } },
      update: {
        title: data.title,
        gdriveFileId: data.gdriveFileId,
        source: data.source || 'gdrive',
        enabled: true,
      },
      create: {
        orgId,
        tmdbId,
        title: data.title,
        gdriveFileId: data.gdriveFileId,
        source: data.source || 'gdrive',
        enabled: true,
      },
    });
  }

  async deleteStreamMapping(orgId: string, tmdbId: number) {
    return this.prisma.movieStreamMapping.deleteMany({
      where: { orgId, tmdbId },
    });
  }

  // ─── Admin ──────────────────────────────────────────────────────────────────

  async createMovie(orgId: string, dto: CreateMovieDto) {
    // Ensure or create genre category
    let categoryId = dto.categoryId;
    if (!categoryId && dto.genres.length > 0) {
      const genre = dto.genres[0]!;
      const slug = genre.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let category = await this.prisma.catalogCategory.findUnique({
        where: { orgId_slug: { orgId, slug } },
      });
      if (!category) {
        category = await this.prisma.catalogCategory.create({
          data: { orgId, name: genre, slug },
        });
      }
      categoryId = category.id as string;
    }

    if (!categoryId) throw new Error('categoryId or genres required');

    // Create CatalogItem as the product anchor
    const catalogItem = await this.prisma.catalogItem.create({
      data: {
        orgId,
        categoryId,
        slug: dto.slug,
        tags: dto.genres,
        isFeatured: false,
        metadata: { type: 'movie' },
      },
    });

    // Create CatalogItemVariants for rent & buy
    if (dto.rentPriceInr) {
      await this.prisma.catalogItemVariant.create({
        data: {
          orgId,
          itemId: catalogItem.id,
          variantType: 'rent',
          name: `Rent (${dto.rentalHours || 48}h)`,
          price: dto.rentPriceInr,
          isActive: true,
        },
      });
    }

    if (dto.buyPriceInr) {
      await this.prisma.catalogItemVariant.create({
        data: {
          orgId,
          itemId: catalogItem.id,
          variantType: 'buy',
          name: 'Buy (Own Forever)',
          price: dto.buyPriceInr,
          isActive: true,
        },
      });
    }

    // Create MovieDetail
    const movie = await this.prisma.movieDetail.create({
      data: {
        orgId,
        catalogItemId: catalogItem.id,
        title: dto.title,
        originalTitle: dto.originalTitle ?? null,
        synopsis: dto.synopsis ?? null,
        releaseYear: dto.releaseYear,
        durationMinutes: dto.durationMinutes,
        contentRating: dto.contentRating,
        languages: dto.languages,
        subtitles: dto.subtitles || [],
        posterUrl: dto.posterUrl ?? null,
        backdropUrl: dto.backdropUrl ?? null,
        trailerUrl: dto.trailerUrl ?? null,
        streamUrl: dto.streamUrl ?? null,
        rentPriceInr: dto.rentPriceInr ?? null,
        buyPriceInr: dto.buyPriceInr ?? null,
        rentalHours: dto.rentalHours || 48,
        rentalMaxPlays: dto.rentalMaxPlays || 3,
        moods: dto.moods || [],
      },
    });

    // Create credits
    if (dto.credits) {
      await this.prisma.movieCredit.createMany({
        data: dto.credits.map((c, i) => ({
          orgId,
          movieDetailId: movie.id,
          personName: c.personName,
          personSlug: c.personSlug,
          role: c.role,
          character: c.character ?? null,
          photoUrl: c.photoUrl ?? null,
          sortOrder: c.sortOrder ?? i,
        })),
      });
    }

    return movie;
  }
}
