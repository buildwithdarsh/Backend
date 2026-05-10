import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/index.js';
import { TmdbService } from '../../services/tmdb/tmdb.service.js';
import { GDriveService } from '../../services/gdrive/gdrive.service.js';
import { MoviesService } from './movies.service.js';

type MovieCard = ReturnType<TmdbService['transformForCard']>;
type EnrichedCard = MovieCard & { hasStream: boolean; isDemo: boolean };

// Free CC-licensed demo videos (fallback when no GDrive link mapped)
const DEMO_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
];

@ApiTags('Storefront - TMDB Movies')
@Controller('api/v1/storefront/tmdb')
@Public()
export class TmdbMoviesController {
  constructor(
    private readonly tmdb: TmdbService,
    private readonly gdrive: GDriveService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly moviesService: MoviesService,
  ) {}

  /** Enrich movie cards with hasStream/isDemo by bulk-checking stream mappings */
  private async enrichCards(cards: MovieCard[]): Promise<EnrichedCard[]> {
    const tmdbIds = cards.map((c) => (c as Record<string, unknown>)['tmdbId'] as number).filter(Boolean);
    const mapped = await this.moviesService.getMappedTmdbIds(tmdbIds);
    return cards.map((c) => {
      const tmdbId = (c as Record<string, unknown>)['tmdbId'] as number;
      const hasStream = mapped.has(tmdbId);
      return { ...c, hasStream, isDemo: !hasStream };
    });
  }

  @Get('popular')
  @ApiOperation({ summary: 'Popular movies from TMDB' })
  async getPopular(
    @Query('page') page?: string,
    @Query('language') language?: string,
    @Query('region') region?: string,
  ) {
    const data = await this.tmdb.getPopular(
      Number(page) || 1,
      language || 'en-US',
      region || 'IN',
    );
    const cards = data.results.map((m) => this.tmdb.transformForCard(m));
    return { data: await this.enrichCards(cards), totalPages: data.total_pages };
  }

  @Get('trending')
  @ApiOperation({ summary: 'Trending movies this week' })
  async getTrending(@Query('language') language?: string) {
    const data = await this.tmdb.getTrending('week', language || 'en-US');
    return { data: await this.enrichCards(data.results.map((m) => this.tmdb.transformForCard(m))) };
  }

  @Get('bollywood')
  @ApiOperation({ summary: 'Popular Bollywood movies' })
  async getBollywood(@Query('page') page?: string) {
    const data = await this.tmdb.getBollywood(Number(page) || 1);
    return { data: await this.enrichCards(data.results.map((m) => this.tmdb.transformForCard(m))) };
  }

  @Get('hollywood')
  @ApiOperation({ summary: 'Popular Hollywood movies' })
  async getHollywood(@Query('page') page?: string) {
    const data = await this.tmdb.discover({
      with_original_language: 'en',
      sort_by: 'popularity.desc',
      page: Number(page) || 1,
    });
    return { data: await this.enrichCards(data.results.map((m) => this.tmdb.transformForCard(m))) };
  }

  @Get('tamil')
  @ApiOperation({ summary: 'Popular Tamil movies' })
  async getTamil(@Query('page') page?: string) {
    const data = await this.tmdb.getTamil(Number(page) || 1);
    return { data: await this.enrichCards(data.results.map((m) => this.tmdb.transformForCard(m))) };
  }

  @Get('telugu')
  @ApiOperation({ summary: 'Popular Telugu movies' })
  async getTelugu(@Query('page') page?: string) {
    const data = await this.tmdb.getTelugu(Number(page) || 1);
    return { data: await this.enrichCards(data.results.map((m) => this.tmdb.transformForCard(m))) };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search movies' })
  async search(
    @Query('q') query: string,
    @Query('page') page?: string,
  ) {
    const data = await this.tmdb.search(query, Number(page) || 1);
    const cards = data.results.map((m) => this.tmdb.transformForCard(m));
    return { data: await this.enrichCards(cards), totalPages: data.total_pages };
  }

  @Get('genres')
  @ApiOperation({ summary: 'Movie genres list' })
  async getGenres() {
    return this.tmdb.getGenres();
  }

  // ── Stream URL endpoint ──────────────────────────────────────────────────
  // Returns a proxy URL (/play/:id) for real content — never exposes raw GDrive URLs.
  // Auth is enforced by the /play/:id endpoint itself.
  @Get('stream/:id')
  @ApiOperation({ summary: 'Get stream URL for a movie' })
  async getStreamUrl(@Param('id') id: string, @Req() req: Request) {
    const tmdbId = Number(id);

    let mapping: { gdriveFileId: string } | null = null;
    try {
      mapping = await this.moviesService.getStreamMapping(tmdbId);
    } catch {
      // DB error — fall through to demo
    }

    if (mapping?.gdriveFileId && this.gdrive.isConfigured()) {
      // Return the proxy URL — never the raw GDrive URL
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      return {
        streamUrl: `${baseUrl}/api/v1/storefront/tmdb/play/${id}`,
        source: 'proxy',
        isDemo: false,
      };
    }

    return {
      streamUrl: DEMO_VIDEOS[tmdbId % DEMO_VIDEOS.length],
      source: 'demo',
      isDemo: true,
    };
  }

  // ── Get the public key for JWT verification ──
  private getPublicKey(): string | null {
    // Try nested config first (from configuration.ts), then raw env
    const key = this.configService.get<string>('jwt.publicKey')
      || this.configService.get<string>('JWT_PUBLIC_KEY');
    return key || null;
  }

  // ── Verify end-user JWT (RS256) ──
  private async verifyToken(token: string): Promise<{ sub: string; orgId: string } | null> {
    const publicKey = this.getPublicKey();
    if (!publicKey) return null;
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        publicKey,
        algorithms: ['RS256'],
      });
      if (payload?.sub && payload?.orgId && payload?.type === 'enduser_access') {
        return { sub: payload.sub, orgId: payload.orgId };
      }
      return null;
    } catch {
      return null;
    }
  }

  private async verifyEndUser(req: Request): Promise<{ sub: string; orgId: string } | null> {
    const auth = req.headers['authorization'] as string | undefined;
    if (!auth?.startsWith('Bearer ')) return null;
    return this.verifyToken(auth.substring(7));
  }

  // ── Proxy Stream endpoint ────────────────────────────────────────────────
  // Streams GDrive video bytes through the backend. No GDrive URL exposed to client.
  // Supports HTTP Range requests for seeking.
  // Auth required for real content. Demo videos are free.
  @Get('play/:id')
  @ApiOperation({ summary: 'Proxy-stream a movie video (auth required for real content)' })
  async proxyStream(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const tmdbId = Number(id);
      let mapping: { gdriveFileId: string } | null = null;
      try {
        mapping = await this.moviesService.getStreamMapping(tmdbId);
      } catch {
        // DB error — fall through to demo
      }

      // If no GDrive mapping, redirect to demo video (no auth needed for demos)
      if (!mapping?.gdriveFileId || !this.gdrive.isConfigured()) {
        const demoUrl = DEMO_VIDEOS[tmdbId % DEMO_VIDEOS.length]!;
        res.redirect(302, demoUrl);
        return;
      }

      // ── Auth check for real content ──
      // Accepts Authorization header OR ?token= query param
      // (video elements can't set custom headers, so we support token in URL)
      const tokenParam = (req.query?.['token'] as string) || null;
      const endUser = tokenParam
        ? await this.verifyToken(tokenParam)
        : await this.verifyEndUser(req);

      if (!endUser) {
        res.status(401).json({ error: 'Login required to watch' });
        return;
      }

      // Proxy stream from GDrive
      const rangeHeader = req.headers['range'] as string | undefined;
      const stream = await this.gdrive.proxyStream(mapping.gdriveFileId, rangeHeader);

      // Set response headers
      for (const [key, val] of Object.entries(stream.headers)) {
        res.setHeader(key, val);
      }

      // 206 Partial Content for range requests, 200 for full
      res.status(stream.status);

      if (!stream.body) {
        res.end();
        return;
      }

      // Pipe the ReadableStream to Express response
      const reader = stream.body.getReader();
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) { res.end(); break; }
            if (!res.write(value)) {
              await new Promise<void>((resolve) => res.once('drain', resolve));
            }
          }
        } catch {
          res.end();
        }
      };

      // Handle client disconnect
      req.on('close', () => { reader.cancel(); });
      await pump();
    } catch (err) {
      // Catch-all — @Res() bypasses NestJS error handling
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream error' });
      }
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Movie detail by TMDB ID' })
  async getDetail(@Param('id') id: string) {
    const movie = await this.tmdb.getMovieDetail(Number(id));
    const director = movie.credits?.crew?.find((c) => c.job === 'Director');
    const trailer = movie.videos?.results?.find(
      (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'),
    );

    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 0;
    const rating = Math.round(movie.vote_average * 10) / 10;
    const language = movie.spoken_languages?.[0]?.english_name || 'English';
    const runtime = movie.runtime || 120;

    const ppm = TmdbService.calculatePpm({ year, rating, language, popularity: movie.popularity });
    const meterCap = Math.round(runtime * ppm.ratePerMin);

    // Check if this movie has a GDrive stream
    const mapping = await this.moviesService.getStreamMapping(Number(id));
    const hasStream = !!mapping?.gdriveFileId;

    return {
      tmdbId: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      tagline: movie.tagline,
      overview: movie.overview,
      posterUrl: this.tmdb.posterUrl(movie.poster_path),
      backdropUrl: this.tmdb.backdropUrl(movie.backdrop_path, 'original'),
      rating,
      voteCount: movie.vote_count,
      year,
      runtime,
      genres: movie.genres,
      languages: movie.spoken_languages?.map((l) => l.english_name) || [],
      status: movie.status,
      ppm: {
        ...ppm,
        meterCap,
        fullMovieCost: meterCap,
        thirtyMinCost: Math.round(30 * ppm.ratePerMin * 100) / 100,
      },
      director: director ? { name: director.name, photoUrl: this.tmdb.profileUrl(director.profile_path) } : null,
      cast: movie.credits?.cast?.slice(0, 12).map((c) => ({
        name: c.name,
        character: c.character,
        photoUrl: this.tmdb.profileUrl(c.profile_path),
      })) || [],
      trailerKey: trailer?.key || null,
      similar: movie.similar?.results?.slice(0, 8).map((m) => this.tmdb.transformForCard(m)) || [],
      hasStream,
      isDemo: !hasStream,
      views: TmdbService.calculateViews(movie.id, rating),
      viewsFormatted: TmdbService.formatViews(TmdbService.calculateViews(movie.id, rating)),
    };
  }
}
