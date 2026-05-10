import type { PaginatedQuery } from './query';

export interface SuperAdminLoginDto {
  email: string;
  password: string;
}

export interface ListSuperAdminsQuery extends PaginatedQuery {}

export interface CreateSuperAdminDto {
  email: string;
  password: string;
  name: string;
  role: 'super_admin' | 'support' | 'finance';
}

export interface ListOrganizationsQuery extends PaginatedQuery {
  search?: string;
}
