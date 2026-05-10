import type { ScopedClient } from '../client';
import type { HelpArticle } from '../types';

export function createStorefrontHelp(c: ScopedClient) {
  return {
    list() {
      return c.get<HelpArticle[]>('/content?type=help');
    },

    getBySlug(slug: string) {
      return c.get<HelpArticle>(`/content/${slug}`);
    },
  };
}
