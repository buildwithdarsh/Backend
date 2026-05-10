import { randomUUID } from 'node:crypto';

// ─── Meta ────────────────────────────────────────────────────────────────────

export interface ResponseMeta {
  timestamp: string;
  requestId: string;
}

function buildMeta(requestId?: string): ResponseMeta {
  return {
    timestamp: new Date().toISOString(),
    requestId: requestId ?? randomUUID(),
  };
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export class PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;

  constructor(page: number, limit: number, total: number) {
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = Math.ceil(total / limit);
    this.hasNextPage = page < this.totalPages;
    this.hasPrevPage = page > 1;
  }
}

// ─── Success Envelope ────────────────────────────────────────────────────────

export class ApiResponse<T> {
  success: true = true;
  data: T;
  message: string | null;
  meta: ResponseMeta;

  constructor(data: T, message?: string | null, requestId?: string) {
    this.data = data;
    this.message = message ?? null;
    this.meta = buildMeta(requestId);
  }
}

export class ApiPaginatedResponse<T> {
  success: true = true;
  data: T[];
  pagination: PaginatedMeta;
  message: string | null;
  meta: ResponseMeta;

  constructor(
    data: T[],
    pagination: PaginatedMeta,
    message?: string | null,
    requestId?: string,
  ) {
    this.data = data;
    this.pagination = pagination;
    this.message = message ?? null;
    this.meta = buildMeta(requestId);
  }
}

// ─── Error Envelope ──────────────────────────────────────────────────────────

export class ApiErrorResponse {
  success: false = false;
  error: {
    code: string;
    message: string;
    details: unknown | null;
  };
  meta: ResponseMeta;

  constructor(
    code: string,
    message: string,
    details?: unknown,
    requestId?: string,
  ) {
    this.error = { code, message, details: details ?? null };
    this.meta = buildMeta(requestId);
  }
}
