import type { ScopedClient } from '../client';
import type {
  GmailAccount,
  TrackedSubscription,
  SubscriptionAlert,
  SubscriptionSuggestion,
  SubRadarSummary,
  SubRadarTrend,
} from '../types';
import type {
  GmailCallbackDto,
  AddTrackedSubscriptionDto,
  UpdateTrackedSubscriptionDto,
  QueryTrackedSubscriptionsDto,
  QuerySubscriptionAlertsDto,
  QuerySubscriptionSuggestionsDto,
  SuggestionActionDto,
} from '../dto';

export function createStorefrontSubRadar(c: ScopedClient) {
  return {
    // ─── Gmail Accounts ────────────────────────────────────────────────

    gmail: {
      /** List all connected Gmail accounts (no tokens). */
      list() {
        return c.get<{ accounts: GmailAccount[] }>('/gmail-accounts', 'enduser');
      },

      /** Get the Google OAuth URL to connect a Gmail account. */
      getConnectUrl() {
        return c.get<{ url: string }>('/gmail-accounts/connect', 'enduser');
      },

      /** Exchange OAuth code and connect a Gmail account. */
      callback(data: GmailCallbackDto) {
        return c.post<{ account: GmailAccount }>('/gmail-accounts/callback', data, 'enduser');
      },

      /** Trigger a Gmail scan for a connected account. */
      triggerScan(accountId: string) {
        return c.post<{ message: string; accountId: string }>(
          `/gmail-accounts/${accountId}/scan`,
          undefined,
          'enduser',
        );
      },

      /** Disconnect a Gmail account. */
      disconnect(accountId: string) {
        return c.del<{ message: string }>(`/gmail-accounts/${accountId}`, 'enduser');
      },
    },

    // ─── Tracked Subscriptions ─────────────────────────────────────────

    subscriptions: {
      /** List tracked subscriptions with optional filters. */
      list(params?: QueryTrackedSubscriptionsDto) {
        return c.paginated<TrackedSubscription>('/tracked-subscriptions', params, 'enduser');
      },

      /** Get a single tracked subscription. */
      get(id: string) {
        return c.get<TrackedSubscription>(`/tracked-subscriptions/${id}`, 'enduser');
      },

      /** Monthly spending summary (totals + category breakdown). */
      summary() {
        return c.get<{
          totalMonthlyPaise: number;
          totalAnnualPaise: number;
          activeCount: number;
          byCategory: Record<string, number>;
        }>('/tracked-subscriptions/summary', 'enduser');
      },

      /** Manually add a subscription. */
      add(data: AddTrackedSubscriptionDto) {
        return c.post<TrackedSubscription>('/tracked-subscriptions', data, 'enduser');
      },

      /** Update a tracked subscription. */
      update(id: string, data: UpdateTrackedSubscriptionDto) {
        return c.patch<TrackedSubscription>(`/tracked-subscriptions/${id}`, data, 'enduser');
      },

      /** Remove a tracked subscription (soft delete). */
      remove(id: string) {
        return c.del<{ message: string }>(`/tracked-subscriptions/${id}`, 'enduser');
      },
    },

    // ─── Alerts ────────────────────────────────────────────────────────

    alerts: {
      /** List subscription alerts. */
      list(params?: QuerySubscriptionAlertsDto) {
        return c.paginated<SubscriptionAlert>('/subscription-alerts', params, 'enduser');
      },

      /** Dismiss a single alert. */
      dismiss(alertId: string) {
        return c.post<{ message: string }>(
          `/subscription-alerts/${alertId}/dismiss`,
          undefined,
          'enduser',
        );
      },

      /** Dismiss all alerts. */
      dismissAll() {
        return c.post<{ message: string }>(
          '/subscription-alerts/dismiss-all',
          undefined,
          'enduser',
        );
      },
    },

    // ─── Suggestions ───────────────────────────────────────────────────

    suggestions: {
      /** List pending money-saving suggestions. */
      list(params?: QuerySubscriptionSuggestionsDto) {
        return c.paginated<SubscriptionSuggestion>('/subscription-suggestions', params, 'enduser');
      },

      /** Act on a suggestion: accept / dismiss / not_interested. */
      action(suggestionId: string, data: SuggestionActionDto) {
        return c.post<{ message: string }>(
          `/subscription-suggestions/${suggestionId}/action`,
          data,
          'enduser',
        );
      },
    },

    // ─── Analytics ─────────────────────────────────────────────────────

    analytics: {
      /** Full spending summary with category breakdown, low-usage counts, etc. */
      summary() {
        return c.get<SubRadarSummary>('/subscription-analytics/summary', 'enduser');
      },

      /** Month-by-month spending trend for the last N months. */
      trends(months?: number) {
        const qs = months ? `?months=${months}` : '';
        return c.get<SubRadarTrend>(`/subscription-analytics/trends${qs}`, 'enduser');
      },
    },
  };
}
