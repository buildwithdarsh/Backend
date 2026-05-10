import type { ScopedClient } from '../client';
import type { ReferralInfo, ReferralValidation } from '../types';
import type { ValidateReferralDto } from '../dto';

export function createStorefrontReferrals(c: ScopedClient) {
  return {
    getMyCode() {
      return c.get<ReferralInfo>('/referral', 'enduser');
    },

    validate(data: ValidateReferralDto) {
      return c.post<ReferralValidation>('/referral/validate', data);
    },
  };
}
