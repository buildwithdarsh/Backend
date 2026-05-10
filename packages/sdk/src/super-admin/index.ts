import type { TZClient, ScopedClient } from '../client';
import type { SuperAdminStats, SuperAdmin, AdminOrganization, PlatformPlan, AuditLog } from '../types';
import type { SuperAdminLoginDto, ListSuperAdminsQuery, CreateSuperAdminDto, ListOrganizationsQuery } from '../dto';
import type { PaginatedQuery } from '../dto';

export function createSuperAdmin(root: TZClient, c: ScopedClient) {
  return {
    // ─── Auth ────────────────────────────────────────────────────────

    auth: {
      login(data: SuperAdminLoginDto) {
        return root.rawRequest<{ accessToken: string }>('POST', '/admin/login', { body: data, scope: 'public', sendOrgKey: false })
          .then((r) => { root.saveSuperAdminToken(r.data.accessToken); return r.data; });
      },
      getToken: () => root.getSuperAdminToken(),
      clearToken: () => root.clearSuperAdminToken(),
    },

    // ─── Dashboard ───────────────────────────────────────────────────

    stats() { return c.get<SuperAdminStats>('/admin/stats'); },

    // ─── Super Admins ────────────────────────────────────────────────

    admins: {
      list(params?: ListSuperAdminsQuery) { return c.paginated<SuperAdmin>('/admin/super-admins', params); },
      create(data: CreateSuperAdminDto) { return c.post<SuperAdmin>('/admin/super-admins', data); },
    },

    // ─── Organizations ───────────────────────────────────────────────

    orgs: {
      list(params?: ListOrganizationsQuery) { return c.paginated<AdminOrganization>('/admin/orgs', params); },
      get(id: string) { return c.get<AdminOrganization>(`/admin/orgs/${id}`); },
      getBySlug(slug: string) { return c.get<AdminOrganization>(`/admin/orgs/slug/${slug}`); },
      create(data: Record<string, unknown>) { return c.post<AdminOrganization>('/admin/orgs', data); },
      update(id: string, data: Record<string, unknown>) { return c.patch<AdminOrganization>(`/admin/orgs/${id}`, data); },
      remove(id: string) { return c.del<void>(`/admin/orgs/${id}`); },
      suspend(id: string) { return c.post<void>(`/admin/orgs/${id}/suspend`); },
      reinstate(id: string) { return c.post<void>(`/admin/orgs/${id}/reinstate`); },
      regenerateKey(id: string) { return c.post<{ orgKey: string }>(`/admin/orgs/${id}/regenerate-key`); },
      impersonate(id: string) { return c.post<{ accessToken: string; refreshToken: string }>(`/admin/orgs/${id}/impersonate`); },
    },

    // ─── Org Config ──────────────────────────────────────────────────

    orgConfig: {
      get(orgId: string) { return c.get<Record<string, unknown>>(`/admin/orgs/${orgId}/config`); },
      update(orgId: string, data: Record<string, unknown>) { return c.patch<void>(`/admin/orgs/${orgId}/config`, data); },
      test(orgId: string, group: string) { return c.post<unknown>(`/admin/orgs/${orgId}/config/test/${group}`); },
      reset(orgId: string, group: string) { return c.post<void>(`/admin/orgs/${orgId}/config/reset/${group}`); },
    },

    // ─── Platform Config ─────────────────────────────────────────────

    platformConfig: {
      get() { return c.get<Record<string, unknown>>('/admin/platform-config'); },
      update(data: Record<string, unknown>) { return c.patch<void>('/admin/platform-config', data); },
      test(group: string) { return c.post<unknown>(`/admin/platform-config/test/${group}`); },
    },

    // ─── Plans ───────────────────────────────────────────────────────

    plans: {
      create(data: Record<string, unknown>) { return c.post<PlatformPlan>('/admin/plans', data); },
      update(id: string, data: Record<string, unknown>) { return c.patch<PlatformPlan>(`/admin/plans/${id}`, data); },
    },

    // ─── Invoices ────────────────────────────────────────────────────

    invoices: {
      list(params?: PaginatedQuery) { return c.paginated<unknown>('/admin/invoices', params); },
      markPaid(id: string) { return c.patch<void>(`/admin/invoices/${id}`); },
    },

    // ─── Usage ───────────────────────────────────────────────────────

    usage() { return c.get<unknown>('/admin/usage'); },

    // ─── Audit ───────────────────────────────────────────────────────

    audit(params?: PaginatedQuery) { return c.paginated<AuditLog>('/admin/audit', params); },

    // ─── Movies (Super Admin) ────────────────────────────────────────

    movies: {
      create(data: Record<string, unknown>) { return c.post<unknown>('/admin/movies', data); },
      listStreamMappings() { return c.get<unknown[]>('/admin/movies/stream-mappings'); },
      upsertStreamMapping(data: Record<string, unknown>) { return c.post<unknown>('/admin/movies/stream-mappings', data); },
      removeStreamMapping(tmdbId: number) { return c.del<void>(`/admin/movies/stream-mappings/${tmdbId}`); },
    },
  };
}
