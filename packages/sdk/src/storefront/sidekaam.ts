import type { ScopedClient } from '../client';
import { toQs } from '../client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SideKaamProfile {
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

export interface SideKaamExperience {
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

export interface SideKaamBooking {
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
  experience?: SideKaamExperience;
  createdAt: string;
}

export interface SideKaamReview {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  text?: string;
  createdAt: string;
}

export interface SideKaamOnboarding {
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

export interface CreateExperienceInput {
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
  experienceId: string;
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

export interface SearchExperiencesInput {
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

export function createStorefrontSideKaam(c: ScopedClient) {
  return {
    // Profile
    createProfile: (data: CreateProfileInput) => c.post<SideKaamProfile>('/sidekaam/profile', data, 'enduser'),
    getProfile: () => c.get<SideKaamProfile>('/sidekaam/profile', 'enduser'),
    updateProfile: (data: UpdateProfileInput) => c.put<SideKaamProfile>('/sidekaam/profile', data, 'enduser'),
    searchProfiles: (params?: { category?: string; city?: string; page?: number; limit?: number }) =>
      c.get<{ items: SideKaamProfile[]; total: number; page: number; totalPages: number }>(`/sidekaam/profiles${toQs(params)}`, 'enduser'),

    // Experiences (public: search, getExperience; enduser: create, update, mine)
    createExperience: (data: CreateExperienceInput) => c.post<SideKaamExperience>('/sidekaam/experiences', data, 'enduser'),
    getExperience: (id: string) => c.get<SideKaamExperience>(`/sidekaam/experiences/${id}`),
    updateExperience: (id: string, data: Partial<CreateExperienceInput>) => c.put<SideKaamExperience>(`/sidekaam/experiences/${id}`, data, 'enduser'),
    searchExperiences: (params?: SearchExperiencesInput) =>
      c.get<{ items: SideKaamExperience[]; total: number; page: number; totalPages: number }>(`/sidekaam/experiences${toQs(params as Record<string, unknown>)}`),
    getMyExperiences: () => c.get<SideKaamExperience[]>('/sidekaam/experiences/mine', 'enduser'),

    // Bookings
    createBooking: (data: CreateBookingInput) => c.post<SideKaamBooking>('/sidekaam/bookings', data, 'enduser'),
    getMyBookings: (role?: 'experiencer' | 'provider') =>
      c.get<SideKaamBooking[]>(`/sidekaam/bookings${toQs({ role })}`, 'enduser'),
    updateBookingStatus: (id: string, status: string, note?: string) =>
      c.patch<SideKaamBooking>(`/sidekaam/bookings/${id}/status`, { status, note }, 'enduser'),

    // Reviews
    createReview: (data: CreateReviewInput) => c.post<SideKaamReview>('/sidekaam/reviews', data, 'enduser'),
    getReviews: (userId: string) => c.get<SideKaamReview[]>(`/sidekaam/reviews/${userId}`),

    // Matches
    getMatches: () => c.get<(SideKaamExperience | SideKaamProfile)[]>('/sidekaam/matches', 'enduser'),

    // Onboarding
    saveOnboarding: (data: SaveOnboardingInput) => c.post<SideKaamOnboarding>('/sidekaam/onboarding', data, 'enduser'),
    getOnboarding: () => c.get<SideKaamOnboarding | null>('/sidekaam/onboarding', 'enduser'),

  };
}
