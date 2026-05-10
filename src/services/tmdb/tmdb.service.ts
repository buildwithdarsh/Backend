import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  original_language: string;
  popularity: number;
  adult: boolean;
}

export interface TmdbMovieDetail extends TmdbMovie {
  runtime: number;
  genres: Array<{ id: number; name: string }>;
  spoken_languages: Array<{ iso_639_1: string; english_name: string; name: string }>;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  tagline: string;
  status: string;
  budget: number;
  revenue: number;
  credits?: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
      order: number;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
      department: string;
      profile_path: string | null;
    }>;
  };
  videos?: {
    results: Array<{
      key: string;
      site: string;
      type: string;
      name: string;
    }>;
  };
  similar?: {
    results: TmdbMovie[];
  };
}

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('TMDB_API_KEY', '');
    if (!this.apiKey) {
      this.logger.warn('TMDB_API_KEY not configured');
    }
  }

  private async fetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${TMDB_BASE}${path}`);
    url.searchParams.set('api_key', this.apiKey);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`TMDB ${path}: ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<T>;
  }

  // ─── Image URL helpers ──────────────────────────────────────────────────────

  posterUrl(path: string | null, size = 'w500'): string | null {
    return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
  }

  backdropUrl(path: string | null, size = 'w1280'): string | null {
    return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
  }

  profileUrl(path: string | null, size = 'w185'): string | null {
    return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
  }

  // ─── Discovery ──────────────────────────────────────────────────────────────

  async getPopular(page = 1, language = 'en-US', region = 'IN') {
    return this.fetch<{ results: TmdbMovie[]; total_pages: number; total_results: number }>(
      '/movie/popular',
      { page: String(page), language, region },
    );
  }

  async getTrending(timeWindow: 'day' | 'week' = 'week', language = 'en-US') {
    return this.fetch<{ results: TmdbMovie[] }>(
      `/trending/movie/${timeWindow}`,
      { language },
    );
  }

  async getNowPlaying(page = 1, language = 'en-US', region = 'IN') {
    return this.fetch<{ results: TmdbMovie[] }>(
      '/movie/now_playing',
      { page: String(page), language, region },
    );
  }

  async getUpcoming(page = 1, language = 'en-US', region = 'IN') {
    return this.fetch<{ results: TmdbMovie[] }>(
      '/movie/upcoming',
      { page: String(page), language, region },
    );
  }

  async getTopRated(page = 1, language = 'en-US', region = 'IN') {
    return this.fetch<{ results: TmdbMovie[] }>(
      '/movie/top_rated',
      { page: String(page), language, region },
    );
  }

  // ─── Discover with filters ──────────────────────────────────────────────────

  async discover(params: {
    page?: number;
    language?: string;
    sort_by?: string;
    with_original_language?: string; // 'hi' for Hindi, 'ta' for Tamil, etc.
    with_genres?: string; // genre IDs comma-separated
    'vote_average.gte'?: string;
    'primary_release_date.gte'?: string;
    'primary_release_date.lte'?: string;
    region?: string;
  }) {
    const strParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) strParams[k] = String(v);
    }
    return this.fetch<{ results: TmdbMovie[]; total_pages: number; total_results: number }>(
      '/discover/movie',
      strParams,
    );
  }

  // ─── Bollywood / Regional shortcuts ─────────────────────────────────────────

  async getBollywood(page = 1) {
    return this.discover({
      with_original_language: 'hi',
      sort_by: 'popularity.desc',
      page,
      language: 'en-US',
    });
  }

  async getTamil(page = 1) {
    return this.discover({ with_original_language: 'ta', sort_by: 'popularity.desc', page });
  }

  async getTelugu(page = 1) {
    return this.discover({ with_original_language: 'te', sort_by: 'popularity.desc', page });
  }

  // ─── Movie Detail ───────────────────────────────────────────────────────────

  async getMovieDetail(tmdbId: number, language = 'en-US'): Promise<TmdbMovieDetail> {
    return this.fetch<TmdbMovieDetail>(
      `/movie/${tmdbId}`,
      { language, append_to_response: 'credits,videos,similar' },
    );
  }

  // ─── Search ─────────────────────────────────────────────────────────────────

  async search(query: string, page = 1, language = 'en-US', region = 'IN') {
    return this.fetch<{ results: TmdbMovie[]; total_pages: number; total_results: number }>(
      '/search/movie',
      { query, page: String(page), language, region, include_adult: 'false' },
    );
  }

  // ─── Genres list ────────────────────────────────────────────────────────────

  async getGenres(language = 'en-US') {
    return this.fetch<{ genres: Array<{ id: number; name: string }> }>(
      '/genre/movie/list',
      { language },
    );
  }

  // ─── PPM Pricing Engine ──────────────────────────────────────────────────────
  //
  // Single source of truth for per-minute pricing.
  // Based on: year (recency), rating (quality), language (market), popularity.
  // Same function used for display AND deduction validation.
  //

  static calculatePpm(movie: {
    year: number;
    rating: number;
    language: string;
    popularity?: number;
  }): {
    tier: string;
    ratePerMin: number;
    color: string;
  } {
    const currentYear = new Date().getFullYear();
    const age = currentYear - movie.year; // 0 = this year, 1 = last year, etc.
    const rating = movie.rating;
    const lang = movie.language;
    const isIndianRegional = ['Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Punjabi', 'Bengali'].includes(lang);
    const isMainstream = ['Hindi', 'English'].includes(lang);

    // ── Base rate from recency ──
    let rate: number;
    let tier: string;

    if (age <= 0) {
      // Current year release
      if (isMainstream && rating >= 7) {
        rate = 1.25; tier = 'Ultra Premium';
      } else if (isMainstream) {
        rate = 0.75; tier = 'Premium';
      } else if (isIndianRegional) {
        rate = 0.60; tier = 'Regional New';
      } else {
        rate = 0.50; tier = 'New Release';
      }
    } else if (age <= 2) {
      // 1-2 years old
      if (isMainstream && rating >= 7.5) {
        rate = 0.75; tier = 'Premium';
      } else if (isMainstream) {
        rate = 0.50; tier = 'New Release';
      } else if (isIndianRegional) {
        rate = 0.30; tier = 'Regional';
      } else {
        rate = 0.40; tier = 'International';
      }
    } else {
      // 3+ years old — catalog
      if (rating >= 8) {
        rate = 0.50; tier = 'Classic Premium';
      } else if (isIndianRegional) {
        rate = 0.30; tier = 'Regional Classic';
      } else if (isMainstream) {
        rate = 0.30; tier = 'Classic';
      } else {
        rate = 0.25; tier = 'Catalog';
      }
    }

    // ── Rating bonus/discount ──
    // Highly rated movies (8+) get a slight premium
    if (rating >= 8.5) rate = Math.min(rate + 0.15, 1.50);
    else if (rating >= 8) rate = Math.min(rate + 0.10, 1.50);
    // Low rated (<5) get a discount
    if (rating > 0 && rating < 5) rate = Math.max(rate - 0.10, 0.20);

    // Round to 2 decimal places
    rate = Math.round(rate * 100) / 100;

    // ── Color for UI ──
    const color = rate >= 1.0 ? '#F5A623'   // gold — ultra premium
      : rate >= 0.70 ? '#E8004D'             // crimson — premium
      : rate >= 0.40 ? '#00BFA5'             // teal — standard
      : '#A1A1AA';                            // gray — catalog/budget

    return { tier, ratePerMin: rate, color };
  }

  // ─── Transform helpers for InstaMovieMart format ────────────────────────────

  private mapLanguage(langCode: string): string {
    const map: Record<string, string> = {
      hi: 'Hindi', en: 'English', ta: 'Tamil', te: 'Telugu',
      kn: 'Kannada', ml: 'Malayalam', mr: 'Marathi', pa: 'Punjabi',
      bn: 'Bengali', ko: 'Korean', ja: 'Japanese', fr: 'French',
      es: 'Spanish', de: 'German', it: 'Italian', pt: 'Portuguese',
      zh: 'Chinese', ru: 'Russian', ar: 'Arabic', tr: 'Turkish',
    };
    return map[langCode] || langCode.toUpperCase();
  }

  // ─── Auto-generated view count ─────────────────────────────────────────────
  //
  // Deterministic: same movie always shows the same count on any given day.
  // Formula: (date + month + year) * rating * 10 — grows daily.
  //
  static calculateViews(tmdbId: number, rating: number): number {
    const now = new Date();
    const date = now.getDate();       // 1-31
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();   // 2026

    const seed = (date + month + year) * Math.max(rating, 1) * 10;
    // Add tmdbId-based offset so each movie has a unique count
    const offset = (tmdbId % 997) * 7; // prime-based scatter
    return Math.round(seed + offset);
  }

  static formatViews(count: number): string {
    if (count >= 100000) return `${(count / 100000).toFixed(1)}L`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return String(count);
  }

  transformForCard(movie: TmdbMovie) {
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 0;
    const rating = Math.round(movie.vote_average * 10) / 10;
    const language = this.mapLanguage(movie.original_language);

    const ppm = TmdbService.calculatePpm({ year, rating, language, popularity: movie.popularity });

    const views = TmdbService.calculateViews(movie.id, rating);

    return {
      tmdbId: movie.id,
      title: movie.title,
      posterUrl: this.posterUrl(movie.poster_path),
      backdropUrl: this.backdropUrl(movie.backdrop_path),
      rating,
      year,
      language,
      genreIds: movie.genre_ids,
      overview: movie.overview,
      ppm,
      views,
      viewsFormatted: TmdbService.formatViews(views),
    };
  }
}
