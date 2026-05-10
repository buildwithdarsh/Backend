import type { ScopedClient } from '../client';
import { toQs } from '../client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MarketplaceProfile {
  id: string;
  userId: string;
  userType: 'experiencer' | 'provider';
  categories: string[];
  subcategories: string[];
  city: string;
  workMode: string;
  hourlyRateMin: number;
  hourlyRateMax: number;
  hoursBand?: string;
  scheduleSlots: string[];
  headline?: string;
  pitchText?: string;
  isActive: boolean;
  createdAt: string;
}

export interface MarketplaceOpportunity {
  id: string;
  providerId: string;
  title: string;
  description?: string;
  category: string;
  subcategory?: string;
  city: string;
  workMode: string;
  hoursNeeded: number;
  hourlyBudget: number;
  scheduledDate?: string;
  scheduledTime?: string;
  isRecurring: boolean;
  status: string;
  createdAt: string;
}

export interface MarketplaceBooking {
  id: string;
  experiencerId: string;
  providerId: string;
  experienceId: string;
  date: string;
  startTime?: string;
  durationHours: number;
  hourlyRate: number;
  totalAmount: number;
  message?: string;
  status: string;
  experience?: MarketplaceOpportunity;
  createdAt: string;
}

export interface MarketplaceReview {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  text?: string;
  createdAt: string;
}

export interface MarketplaceOnboarding {
  userType: string;
  categories: string[];
  subcategories: string[];
  hourlyRateBand?: string;
  hoursBand?: string;
  scheduleSlots: string[];
  city?: string;
  workMode?: string;
  budgetBand?: string;
  needWhen?: string;
  onboardingStep?: number;
}

// ─── Input types ────────────────────────────────────────────────────────────

export interface CreateProfileInput {
  userType: 'experiencer' | 'provider';
  categories: string[];
  subcategories?: string[];
  city: string;
  workMode?: string;
  hourlyRateMin: number;
  hourlyRateMax?: number;
  hoursBand?: string;
  scheduleSlots?: string[];
  headline?: string;
  pitchText?: string;
}

export interface UpdateProfileInput {
  categories?: string[];
  subcategories?: string[];
  city?: string;
  workMode?: string;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  hoursBand?: string;
  scheduleSlots?: string[];
  headline?: string;
  pitchText?: string;
  isActive?: boolean;
}

export interface CreateOpportunityInput {
  title: string;
  description?: string;
  category: string;
  subcategory?: string;
  city: string;
  workMode?: string;
  hoursNeeded: number;
  hourlyBudget: number;
  scheduledDate?: string;
  scheduledTime?: string;
  isRecurring?: boolean;
}

export interface CreateBookingInput {
  opportunityId: string;
  date: string;
  startTime?: string;
  durationHours: number;
  message?: string;
}

export interface CreateReviewInput {
  bookingId: string;
  rating: number;
  text?: string;
}

export interface SearchOpportunitiesInput {
  category?: string;
  city?: string;
  workMode?: string;
  budgetMin?: number;
  budgetMax?: number;
  when?: string;
  page?: number;
  limit?: number;
}

export interface SaveOnboardingInput {
  userType: string;
  categories: string[];
  subcategories?: string[];
  hourlyRateBand?: string;
  hoursBand?: string;
  scheduleSlots?: string[];
  city?: string;
  workMode?: string;
  budgetBand?: string;
  needWhen?: string;
  onboardingStep?: number;
}

// ─── Service ────────────────────────────────────────────────────────────────

export function createStorefrontMarketplace(c: ScopedClient) {
  return {
    // Profile
    createProfile: (data: CreateProfileInput) => c.post<MarketplaceProfile>('/marketplace/profile', data, 'enduser'),
    getProfile: () => c.get<MarketplaceProfile>('/marketplace/profile', 'enduser'),
    updateProfile: (data: UpdateProfileInput) => c.put<MarketplaceProfile>('/marketplace/profile', data, 'enduser'),
    searchProfiles: (params?: { category?: string; city?: string; page?: number; limit?: number }) =>
      c.get<{ items: MarketplaceProfile[]; total: number; page: number; totalPages: number }>(`/marketplace/profiles${toQs(params)}`, 'enduser'),
    getProfileById: (id: string) => c.get<MarketplaceProfile>(`/marketplace/profiles/${id}`, 'enduser'),

    // Experiences (public: search, getOpportunity; enduser: create, update, mine)
    createOpportunity: (data: CreateOpportunityInput) => c.post<MarketplaceOpportunity>('/marketplace/opportunities', data, 'enduser'),
    getOpportunity: (id: string) => c.get<MarketplaceOpportunity>(`/marketplace/opportunities/${id}`),
    updateOpportunity: (id: string, data: Partial<CreateOpportunityInput>) => c.put<MarketplaceOpportunity>(`/marketplace/opportunities/${id}`, data, 'enduser'),
    searchOpportunities: (params?: SearchOpportunitiesInput) =>
      c.get<{ items: MarketplaceOpportunity[]; total: number; page: number; totalPages: number }>(`/marketplace/opportunities${toQs(params as Record<string, unknown>)}`),
    getMyOpportunities: () => c.get<MarketplaceOpportunity[]>('/marketplace/opportunities/mine', 'enduser'),

    // Bookings
    createBooking: (data: CreateBookingInput) => c.post<MarketplaceBooking>('/marketplace/bookings', data, 'enduser'),
    getMyBookings: (role?: 'experiencer' | 'provider') =>
      c.get<MarketplaceBooking[]>(`/marketplace/bookings${toQs({ role })}`, 'enduser'),
    updateBookingStatus: (id: string, status: string, note?: string) =>
      c.patch<MarketplaceBooking>(`/marketplace/bookings/${id}/status`, { status, note }, 'enduser'),

    // Connect (profile-to-profile)
    connect: (data: { profileId: string; date: string; startTime?: string; durationHours: number; message?: string }) =>
      c.post<MarketplaceBooking>('/marketplace/connect', data, 'enduser'),

    // Reviews
    createReview: (data: CreateReviewInput) => c.post<MarketplaceReview>('/marketplace/reviews', data, 'enduser'),
    getReviews: (userId: string) => c.get<MarketplaceReview[]>(`/marketplace/reviews/${userId}`, 'enduser'),

    // Matches
    getMatches: () => c.get<(MarketplaceOpportunity | MarketplaceProfile)[]>('/marketplace/matches', 'enduser'),

    // Onboarding
    saveOnboarding: (data: SaveOnboardingInput) => c.post<MarketplaceOnboarding>('/marketplace/onboarding', data, 'enduser'),
    getOnboarding: () => c.get<MarketplaceOnboarding | null>('/marketplace/onboarding', 'enduser'),

  };
}
