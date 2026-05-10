import type { ScopedClient } from '../client';
import type { MealPlan, MealSubscription } from '../types';
import type { SubscribeMealPlanDto } from '../dto';

export function createStorefrontMealPlans(c: ScopedClient) {
  return {
    list() {
      return c.get<MealPlan[]>('/meal-plans');
    },

    get(id: string) {
      return c.get<MealPlan>(`/meal-plans/${id}`);
    },

    subscribe(data: SubscribeMealPlanDto) {
      return c.post<MealSubscription>('/meal-plans/subscribe', data, 'enduser');
    },

    mySubscriptions() {
      return c.get<MealSubscription[]>('/meal-plans/subscriptions', 'enduser');
    },

    cancelSubscription(id: string) {
      return c.post<MealSubscription>(`/meal-plans/subscriptions/${id}/cancel`, undefined, 'enduser');
    },
  };
}
