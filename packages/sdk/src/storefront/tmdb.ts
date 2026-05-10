import type { ScopedClient } from '../client';
import type { TmdbMovie, TmdbMovieDetail } from '../types';

export function createStorefrontTmdb(c: ScopedClient) {
  return {
    popular(page?: number) {
      return c.get<{ results: TmdbMovie[]; total_pages: number }>(`/tmdb/popular${page ? `?page=${page}` : ''}`);
    },

    trending() {
      return c.get<{ results: TmdbMovie[] }>('/tmdb/trending');
    },

    bollywood(page?: number) {
      return c.get<{ results: TmdbMovie[]; total_pages: number }>(`/tmdb/bollywood${page ? `?page=${page}` : ''}`);
    },

    hollywood(page?: number) {
      return c.get<{ results: TmdbMovie[]; total_pages: number }>(`/tmdb/hollywood${page ? `?page=${page}` : ''}`);
    },

    tamil(page?: number) {
      return c.get<{ results: TmdbMovie[]; total_pages: number }>(`/tmdb/tamil${page ? `?page=${page}` : ''}`);
    },

    telugu(page?: number) {
      return c.get<{ results: TmdbMovie[]; total_pages: number }>(`/tmdb/telugu${page ? `?page=${page}` : ''}`);
    },

    search(query: string, page?: number) {
      return c.get<{ results: TmdbMovie[]; total_pages: number }>(`/tmdb/search?query=${encodeURIComponent(query)}${page ? `&page=${page}` : ''}`);
    },

    genres() {
      return c.get<{ genres: Array<{ id: number; name: string }> }>('/tmdb/genres');
    },

    getStreamUrl(tmdbId: number) {
      return c.get<{ url: string }>(`/tmdb/stream/${tmdbId}`);
    },

    getPlayUrl(tmdbId: number) {
      return `${c.root.baseUrl}/api/v1/storefront/tmdb/play/${tmdbId}`;
    },

    getDetail(tmdbId: number) {
      return c.get<TmdbMovieDetail>(`/tmdb/${tmdbId}`);
    },
  };
}
