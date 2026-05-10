import type { ScopedClient } from '../client';
import type { Movie, MovieDetail, WatchSessionResponse, WatchSessionStatus, WatchSessionSummary, WatchSessionHistoryItem } from '../types';
import type { ListMoviesQuery, UpdateMovieProgressDto, StartWatchSessionDto } from '../dto';

export function createStorefrontMovies(c: ScopedClient) {
  return {
    list(params?: ListMoviesQuery) {
      return c.paginated<Movie>('/movies', params);
    },

    heroBanners() {
      return c.get<Movie[]>('/movies/hero-banners');
    },

    genres() {
      return c.get<{ id: string; name: string }[]>('/movies/genres');
    },

    getBySlug(slug: string) {
      return c.get<MovieDetail>(`/movies/${slug}`);
    },

    library() {
      return c.get<Movie[]>('/movies/library', 'enduser');
    },

    getStreamUrl(id: string) {
      return c.get<{ url: string }>(`/movies/${id}/stream`, 'enduser');
    },

    updateProgress(id: string, data: UpdateMovieProgressDto) {
      return c.post<void>(`/movies/${id}/progress`, data, 'enduser');
    },

    rent(id: string) {
      return c.post<{ entitlementId: string }>(`/movies/${id}/rent`, undefined, 'enduser');
    },

    buy(id: string) {
      return c.post<{ entitlementId: string }>(`/movies/${id}/buy`, undefined, 'enduser');
    },

    // ─── PPM Watch Sessions ──────────────────────────────────────────

    startSession(tmdbId: number, data: StartWatchSessionDto) {
      return c.post<WatchSessionResponse>(`/movies/${tmdbId}/start-session`, data, 'enduser');
    },

    getSessionStatus(sessionId: string) {
      return c.get<WatchSessionStatus>(`/movies/session/${sessionId}/status`, 'enduser');
    },

    pauseSession(sessionId: string) {
      return c.post<WatchSessionStatus>(`/movies/session/${sessionId}/pause`, undefined, 'enduser');
    },

    resumeSession(sessionId: string) {
      return c.post<WatchSessionStatus>(`/movies/session/${sessionId}/resume`, undefined, 'enduser');
    },

    endSession(sessionId: string) {
      return c.post<WatchSessionSummary>(`/movies/session/${sessionId}/end`, undefined, 'enduser');
    },

    updateSessionCap(sessionId: string, meterCapPaise: number) {
      return c.patch<WatchSessionStatus>(`/movies/session/${sessionId}/update-cap`, { meterCapPaise }, 'enduser');
    },

    rateSession(sessionId: string, rating: number) {
      return c.patch<{ session: WatchSessionHistoryItem }>(`/movies/session/${sessionId}/rate`, { rating }, 'enduser');
    },

    getHistory(limit = 50, offset = 0) {
      return c.get<{ sessions: WatchSessionHistoryItem[]; total: number }>(`/movies/sessions/history?limit=${limit}&offset=${offset}`, 'enduser');
    },

    // ─── Watchlist ───────────────────────────────────────────────────

    getWatchlist() {
      return c.get<Movie[]>('/watchlist', 'enduser');
    },

    addToWatchlist(catalogItemId: string) {
      return c.post<void>(`/watchlist/${catalogItemId}`, undefined, 'enduser');
    },

    removeFromWatchlist(catalogItemId: string) {
      return c.del<void>(`/watchlist/${catalogItemId}`, 'enduser');
    },
  };
}
