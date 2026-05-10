import type { TZConfig, TokenStore, ApiError, PaginatedResponse, JsonValue } from './types';
import { TZQuery, TZPaginatedQuery, type RawResponse } from './query';

// ─── Default Token Store (localStorage) ─────────────────────────────────────

const noopStore: TokenStore = {
  get: () => null,
  set: () => {},
  remove: () => {},
};

function createLocalStorageStore(): TokenStore {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    return {
      get: (key) => localStorage.getItem(key),
      set: (key, value) => localStorage.setItem(key, value),
      remove: (key) => localStorage.removeItem(key),
    };
  }
  return noopStore;
}

// ─── Storage Keys ───────────────────────────────────────────────────────────

function makeKeys(prefix: string) {
  return {
    access: `${prefix}-access-token`,
    refresh: `${prefix}-refresh-token`,
    staffAccess: `${prefix}-staff-access-token`,
    staffRefresh: `${prefix}-staff-refresh-token`,
    superAdminAccess: `${prefix}-sa-access-token`,
  } as const;
}

// ─── Auth Scopes ────────────────────────────────────────────────────────────

export type AuthScope = 'enduser' | 'staff' | 'superadmin' | 'public';

// ─── Query Params Helper ────────────────────────────────────────────────────

export function toQs(params?: Record<string, unknown>): string {
  if (!params) return '';
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => [k, String(v)]);
  return entries.length ? '?' + new URLSearchParams(entries).toString() : '';
}

// ─── TZClient (core — manages tokens, refresh, raw fetch) ──────────────────

export class TZClient {
  readonly baseUrl: string;
  readonly orgSlug: string;
  readonly orgKey: string | undefined;
  private readonly store: TokenStore;
  private readonly keys: ReturnType<typeof makeKeys>;
  private readonly onAuthExpired: (() => void) | undefined;

  private enduserRefreshPromise: Promise<string | null> | null = null;
  private staffRefreshPromise: Promise<string | null> | null = null;

  constructor(config: TZConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.orgSlug = config.orgSlug;
    this.orgKey = config.orgKey;
    this.store = config.tokenStore ?? createLocalStorageStore();
    this.keys = makeKeys(config.keyPrefix ?? 'tz');
    this.onAuthExpired = config.onAuthExpired;
  }

  // ─── Token Accessors ───────────────────────────────────────────────────

  getEndUserToken(): string | null { return this.store.get(this.keys.access); }
  getEndUserRefreshToken(): string | null { return this.store.get(this.keys.refresh); }
  saveEndUserTokens(access: string, refresh: string): void {
    this.store.set(this.keys.access, access);
    this.store.set(this.keys.refresh, refresh);
  }
  clearEndUserTokens(): void {
    this.store.remove(this.keys.access);
    this.store.remove(this.keys.refresh);
  }

  getStaffToken(): string | null { return this.store.get(this.keys.staffAccess); }
  getStaffRefreshToken(): string | null { return this.store.get(this.keys.staffRefresh); }
  saveStaffTokens(access: string, refresh: string): void {
    this.store.set(this.keys.staffAccess, access);
    this.store.set(this.keys.staffRefresh, refresh);
  }
  clearStaffTokens(): void {
    this.store.remove(this.keys.staffAccess);
    this.store.remove(this.keys.staffRefresh);
  }

  getSuperAdminToken(): string | null { return this.store.get(this.keys.superAdminAccess); }
  saveSuperAdminToken(token: string): void { this.store.set(this.keys.superAdminAccess, token); }
  clearSuperAdminToken(): void { this.store.remove(this.keys.superAdminAccess); }

  isEndUserAuthenticated(): boolean { return !!this.getEndUserToken(); }
  isStaffAuthenticated(): boolean { return !!this.getStaffToken(); }

  // ─── Token Refresh (singleton to prevent stampede) ─────────────────────

  private async doRefreshEndUser(): Promise<string | null> {
    const rt = this.getEndUserRefreshToken();
    if (!rt) return null;
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/storefront/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Slug': this.orgSlug,
          ...(this.orgKey ? { 'X-Org-Key': this.orgKey } : {}),
        },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) { this.clearEndUserTokens(); this.onAuthExpired?.(); return null; }
      const json = await res.json();
      const access = json.accessToken ?? json.data?.accessToken;
      const refresh = json.refreshToken ?? json.data?.refreshToken;
      if (access) { this.saveEndUserTokens(access, refresh || rt); return access; }
      this.clearEndUserTokens(); this.onAuthExpired?.(); return null;
    } catch { this.clearEndUserTokens(); this.onAuthExpired?.(); return null; }
  }

  private async doRefreshStaff(): Promise<string | null> {
    const rt = this.getStaffRefreshToken();
    if (!rt) return null;
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Org-Slug': this.orgSlug },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) { this.clearStaffTokens(); return null; }
      const json = await res.json();
      const access = json.accessToken ?? json.data?.accessToken;
      const refresh = json.refreshToken ?? json.data?.refreshToken;
      if (access) { this.saveStaffTokens(access, refresh || rt); return access; }
      this.clearStaffTokens(); return null;
    } catch { this.clearStaffTokens(); return null; }
  }

  refreshEndUser(): Promise<string | null> {
    if (!this.enduserRefreshPromise) {
      this.enduserRefreshPromise = this.doRefreshEndUser().finally(() => { this.enduserRefreshPromise = null; });
    }
    return this.enduserRefreshPromise;
  }

  refreshStaff(): Promise<string | null> {
    if (!this.staffRefreshPromise) {
      this.staffRefreshPromise = this.doRefreshStaff().finally(() => { this.staffRefreshPromise = null; });
    }
    return this.staffRefreshPromise;
  }

  // ─── Core Raw Request ──────────────────────────────────────────────────

  async rawRequest<T>(
    method: string,
    fullPath: string,
    opts: { body?: unknown; scope: AuthScope; signal?: AbortSignal; sendOrgKey: boolean },
  ): Promise<RawResponse<T>> {
    const { body, scope, signal, sendOrgKey } = opts;

    try {
      const token = this.resolveToken(scope);

      const headers: Record<string, string> = {
        'X-Org-Slug': this.orgSlug,
        ...(sendOrgKey && this.orgKey ? { 'X-Org-Key': this.orgKey } : {}),
        ...(body !== undefined && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const init: RequestInit = {
        method,
        headers,
        ...(body !== undefined ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
        ...(signal ? { signal } : {}),
      };

      let res = await fetch(`${this.baseUrl}/api/v1${fullPath}`, init);

      // Auto-refresh on 401 (skip auth endpoints)
      if (res.status === 401 && token && !fullPath.includes('/auth/')) {
        const newToken = await this.tryRefresh(scope);
        if (newToken) {
          (init.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
          res = await fetch(`${this.baseUrl}/api/v1${fullPath}`, init);
        }
      }

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          res.status === 403 ? 'You do not have permission to perform this action'
            : res.status === 429 ? 'Too many requests — please try again later'
              : json.message || (typeof json.error === 'string' ? json.error : json.error?.message) || `Request failed (${res.status})`;
        const err = new Error(msg) as ApiError;
        err.status = res.status;
        err.data = json;
        throw err;
      }

      const data = json && typeof json === 'object' && 'success' in json && 'data' in json
        ? (json.data as T)
        : (json as T);

      return { data, raw: json, status: res.status, headers: res.headers };
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err) throw err;
      const error = new Error(err instanceof Error ? err.message : 'Network error — check your connection') as ApiError;
      error.status = 0;
      throw error;
    }
  }

  private resolveToken(scope: AuthScope): string | null {
    switch (scope) {
      case 'enduser': return this.getEndUserToken();
      case 'staff': return this.getStaffToken();
      case 'superadmin': return this.getSuperAdminToken();
      case 'public': return null;
    }
  }

  private async tryRefresh(scope: AuthScope): Promise<string | null> {
    switch (scope) {
      case 'enduser': return this.refreshEndUser();
      case 'staff': return this.refreshStaff();
      default: return null;
    }
  }

  // ─── Scoped Client Factory ─────────────────────────────────────────────

  scoped(pathPrefix: string, defaultScope: AuthScope, sendOrgKey: boolean): ScopedClient {
    return new ScopedClient(this, pathPrefix, defaultScope, sendOrgKey);
  }
}

// ─── ScopedClient — zero-repetition namespace client ─────────────────────────
//
// Each namespace (storefront, admin, superadmin) gets a ScopedClient.
// All methods auto-prepend the prefix and use the correct auth scope.
//
// Example:
//   const sf = client.scoped('/storefront', 'public', true);
//   sf.get('/catalog/items')  →  GET /api/v1/storefront/catalog/items  (PUBLIC, sends X-Org-Key)
//   sf.post('/orders', body, 'enduser')  →  POST with ENDUSER token
//

export class ScopedClient {
  constructor(
    readonly root: TZClient,
    private prefix: string,
    private defaultScope: AuthScope,
    private sendOrgKey: boolean,
  ) {}

  private fullPath(path: string): string {
    return `${this.prefix}${path}`;
  }

  // ─── TZQuery builders (return rich query objects) ──────────────────────

  /** GET → TZQuery<T> with .cancel(), .refetch(), .raw(), .status() */
  get<T>(path: string, scope?: AuthScope): TZQuery<T> {
    const s = scope ?? this.defaultScope;
    const fp = this.fullPath(path);
    return new TZQuery<T>((signal) => this.root.rawRequest<T>('GET', fp, { scope: s, signal, sendOrgKey: this.sendOrgKey }));
  }

  /** POST → TZQuery<T> */
  post<T>(path: string, body?: unknown, scope?: AuthScope): TZQuery<T> {
    const s = scope ?? this.defaultScope;
    const fp = this.fullPath(path);
    return new TZQuery<T>((signal) => this.root.rawRequest<T>('POST', fp, { body, scope: s, signal, sendOrgKey: this.sendOrgKey }));
  }

  /** PATCH → TZQuery<T> */
  patch<T>(path: string, body?: unknown, scope?: AuthScope): TZQuery<T> {
    const s = scope ?? this.defaultScope;
    const fp = this.fullPath(path);
    return new TZQuery<T>((signal) => this.root.rawRequest<T>('PATCH', fp, { body, scope: s, signal, sendOrgKey: this.sendOrgKey }));
  }

  /** PUT → TZQuery<T> */
  put<T>(path: string, body?: unknown, scope?: AuthScope): TZQuery<T> {
    const s = scope ?? this.defaultScope;
    const fp = this.fullPath(path);
    return new TZQuery<T>((signal) => this.root.rawRequest<T>('PUT', fp, { body, scope: s, signal, sendOrgKey: this.sendOrgKey }));
  }

  /** DELETE → TZQuery<T> */
  del<T>(path: string, scope?: AuthScope): TZQuery<T> {
    const s = scope ?? this.defaultScope;
    const fp = this.fullPath(path);
    return new TZQuery<T>((signal) => this.root.rawRequest<T>('DELETE', fp, { scope: s, signal, sendOrgKey: this.sendOrgKey }));
  }

  /** Upload (multipart/form-data) → TZQuery<T> */
  upload<T>(path: string, formData: FormData, scope?: AuthScope): TZQuery<T> {
    const s = scope ?? this.defaultScope;
    const fp = this.fullPath(path);
    return new TZQuery<T>((signal) => this.root.rawRequest<T>('POST', fp, { body: formData, scope: s, signal, sendOrgKey: this.sendOrgKey }));
  }

  /** Paginated GET → TZPaginatedQuery<T> with .next(), .prev(), .goTo() */
  paginated<T>(
    path: string,
    params: { page?: number; limit?: number; [key: string]: unknown } = {},
    scope?: AuthScope,
  ): TZPaginatedQuery<T> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const resolvedScope = scope ?? this.defaultScope;

    const factory = (p: number, l: number): TZPaginatedQuery<T> => {
      const merged = { ...params, page: p, limit: l };
      const qs = toQs(merged);
      const fp = this.fullPath(`${path}${qs}`);

      // Custom executor that reconstructs PaginatedResponse from the envelope
      const executor = async (signal: AbortSignal): Promise<RawResponse<PaginatedResponse<T>>> => {
        const rawRes = await this.root.rawRequest<T[]>('GET', fp, { scope: resolvedScope, signal, sendOrgKey: this.sendOrgKey });
        // The raw envelope contains pagination at the top level
        const envelope = rawRes.raw as Record<string, JsonValue>;
        const pagination = (envelope['pagination'] ?? { page: p, limit: l, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false }) as PaginatedResponse<T>['pagination'];
        return {
          data: { data: rawRes.data, pagination },
          raw: rawRes.raw,
          status: rawRes.status,
          headers: rawRes.headers,
        };
      };

      return new TZPaginatedQuery<T>(executor, p, l, factory);
    };

    return factory(page, limit);
  }

  // ─── Direct await methods (for auth flows that need immediate token save) ─

  async postDirect<T>(path: string, body?: unknown, scope?: AuthScope): Promise<T> {
    return (await this.root.rawRequest<T>('POST', this.fullPath(path), {
      body, scope: scope ?? this.defaultScope, sendOrgKey: this.sendOrgKey,
    })).data;
  }

  async getDirect<T>(path: string, scope?: AuthScope): Promise<T> {
    return (await this.root.rawRequest<T>('GET', this.fullPath(path), {
      scope: scope ?? this.defaultScope, sendOrgKey: this.sendOrgKey,
    })).data;
  }

  async patchDirect<T>(path: string, body?: unknown, scope?: AuthScope): Promise<T> {
    return (await this.root.rawRequest<T>('PATCH', this.fullPath(path), {
      body, scope: scope ?? this.defaultScope, sendOrgKey: this.sendOrgKey,
    })).data;
  }

  async delDirect<T>(path: string, scope?: AuthScope): Promise<T> {
    return (await this.root.rawRequest<T>('DELETE', this.fullPath(path), {
      scope: scope ?? this.defaultScope, sendOrgKey: this.sendOrgKey,
    })).data;
  }
}
