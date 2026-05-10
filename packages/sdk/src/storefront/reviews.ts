import type { ScopedClient } from '../client';
import type { Review } from '../types';
import type { ListReviewsQuery, CreateReviewDto } from '../dto';

export function createStorefrontReviews(c: ScopedClient) {
  return {
    list(params?: ListReviewsQuery) {
      return c.paginated<Review>('/reviews', params);
    },

    myReviews() {
      return c.get<Review[]>('/reviews/my', 'enduser');
    },

    create(data: CreateReviewDto) {
      return c.post<Review>('/reviews', data, 'enduser');
    },

    toggleHelpful(reviewId: string) {
      return c.post<{ helpful: boolean }>(`/reviews/${reviewId}/helpful`, undefined, 'enduser');
    },
  };
}
