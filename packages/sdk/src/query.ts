import type { PaginatedResponse } from './types';

// ─── Raw Response (before envelope unwrap) ──────────────────────────────────

export interface RawResponse<T> {
  data: T;
  raw: unknown;
  status: number;
  headers: Headers;
}

// ─── TZQuery — Rich response wrapper for every API call ─────────────────────
//
// Usage:
//   const q = tz.storefront.catalog.getItems();
//   const items = await q;              // await directly → T
//   const items = await q.data();       // explicit .data()
//   const raw   = await q.raw();        // raw JSON before envelope unwrap
//   const code  = await q.status();     // HTTP status code
//   q.cancel();                          // abort in-flight request
//   const q2 = q.refetch();             // re-execute same request
//

export class TZQuery<T> implements PromiseLike<T> {
  private controller: AbortController;
  private _promise: Promise<RawResponse<T>>;
  private _executor: (signal: AbortSignal) => Promise<RawResponse<T>>;

  constructor(executor: (signal: AbortSignal) => Promise<RawResponse<T>>) {
    this._executor = executor;
    this.controller = new AbortController();
    this._promise = executor(this.controller.signal);
  }

  /** Thenable — `await query` resolves directly to T */
  then<R1 = T, R2 = never>(
    onFulfilled?: ((value: T) => R1 | PromiseLike<R1>) | null,
    onRejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return this._promise.then((r) => r.data).then(onFulfilled, onRejected);
  }

  /** Catch errors */
  catch<R = never>(
    onRejected?: ((reason: unknown) => R | PromiseLike<R>) | null,
  ): Promise<T | R> {
    return this.then(undefined, onRejected);
  }

  /** Get the unwrapped data */
  async data(): Promise<T> {
    return (await this._promise).data;
  }

  /** Get the raw JSON (before envelope unwrap) */
  async raw(): Promise<unknown> {
    return (await this._promise).raw;
  }

  /** Get the HTTP status code */
  async status(): Promise<number> {
    return (await this._promise).status;
  }

  /** Get the response headers */
  async headers(): Promise<Headers> {
    return (await this._promise).headers;
  }

  /** Abort the in-flight request */
  cancel(): void {
    this.controller.abort();
  }

  /** Re-execute the same request (returns a new TZQuery) */
  refetch(): TZQuery<T> {
    return new TZQuery<T>(this._executor);
  }
}

// ─── TZPaginatedQuery — Adds .next() and .prev() for paginated endpoints ────
//
// Usage:
//   const q = tz.storefront.catalog.getItems({ page: 1, limit: 20 });
//   const page1 = await q;                 // PaginatedResponse<CatalogItem>
//   const page2Query = q.next();           // TZPaginatedQuery for page 2
//   const page2 = await page2Query;
//   const backToPage1 = page2Query.prev(); // back to page 1
//

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export class TZPaginatedQuery<T> extends TZQuery<PaginatedResponse<T>> {
  private _page: number;
  private _limit: number;
  private _pageFactory: (page: number, limit: number) => TZPaginatedQuery<T>;

  constructor(
    executor: (signal: AbortSignal) => Promise<RawResponse<PaginatedResponse<T>>>,
    page: number,
    limit: number,
    pageFactory: (page: number, limit: number) => TZPaginatedQuery<T>,
  ) {
    super(executor);
    this._page = page;
    this._limit = limit;
    this._pageFactory = pageFactory;
  }

  /** Current page number */
  get page(): number {
    return this._page;
  }

  /** Current page size */
  get limit(): number {
    return this._limit;
  }

  /** Fetch the next page (returns a new TZPaginatedQuery) */
  next(): TZPaginatedQuery<T> {
    return this._pageFactory(this._page + 1, this._limit);
  }

  /** Fetch the previous page (returns a new TZPaginatedQuery, clamped to page 1) */
  prev(): TZPaginatedQuery<T> {
    return this._pageFactory(Math.max(1, this._page - 1), this._limit);
  }

  /** Jump to a specific page */
  goTo(page: number): TZPaginatedQuery<T> {
    return this._pageFactory(Math.max(1, page), this._limit);
  }

  /** Check if there's a next page (must await first) */
  async hasNext(): Promise<boolean> {
    const result = await this.data();
    return result.pagination.hasNextPage;
  }

  /** Check if there's a previous page */
  hasPrev(): boolean {
    return this._page > 1;
  }

  /** Re-execute the same page */
  override refetch(): TZPaginatedQuery<T> {
    return this._pageFactory(this._page, this._limit);
  }
}
