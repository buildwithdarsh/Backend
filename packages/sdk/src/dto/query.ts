/** Base pagination query shared by all paginated endpoints */
export interface PaginatedQuery {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

/** Pagination + search */
export interface SearchQuery extends PaginatedQuery {
  search?: string;
}

/** Pagination + status filter */
export interface StatusQuery extends PaginatedQuery {
  status?: string;
}

/** Pagination + search + status */
export interface SearchStatusQuery extends PaginatedQuery {
  search?: string;
  status?: string;
}
