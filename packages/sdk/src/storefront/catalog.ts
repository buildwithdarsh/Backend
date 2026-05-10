import type { ScopedClient } from '../client';
import type { CatalogCategory, CatalogItem } from '../types';
import type { GetCatalogItemsQuery } from '../dto';

export function createStorefrontCatalog(c: ScopedClient) {
  return {
    getCategories() {
      return c.get<CatalogCategory[]>('/catalog/categories');
    },

    getItems(params?: GetCatalogItemsQuery) {
      return c.paginated<CatalogItem>('/catalog/items', params);
    },

    getItem(id: string) {
      return c.get<CatalogItem>(`/catalog/items/${id}`);
    },
  };
}
