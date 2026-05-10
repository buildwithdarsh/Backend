import type { ScopedClient } from '../client';
import type { CouponValidation } from '../types';
import type { ValidateCouponDto } from '../dto';

export function createStorefrontCoupons(c: ScopedClient) {
  return {
    validate(data: ValidateCouponDto) {
      return c.post<CouponValidation>('/coupons/validate', data);
    },
  };
}
