import type { ScopedClient } from '../client';
import type { ContentPost } from '../types';
import type { ListContentQuery } from '../dto';

export function createStorefrontContent(c: ScopedClient) {
  return {
    list(params?: ListContentQuery) {
      return c.paginated<ContentPost>('/content', params);
    },

    getBySlug(slug: string) {
      return c.get<ContentPost>(`/content/${slug}`);
    },
  };
}
