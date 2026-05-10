import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { AppSubscriptionsService } from '../app-subscriptions/app-subscriptions.service.js';
import type {
  CreateProfileDto, UpdateProfileDto,
  CreateOpportunityDto, UpdateOpportunityDto,
  CreateBookingDto, UpdateBookingStatusDto,
  CreateReviewDto, SaveOnboardingDto,
} from './dto/index.js';

@Injectable()
export class MarketplaceService {
  constructor(
    private prisma: PrismaService,
    private appSubscriptions: AppSubscriptionsService,
  ) {}

  // ─── Profiles ───────────────────────────────────────────────────────────

  async createProfile(userId: string, orgId: string, dto: CreateProfileDto) {
    return this.prisma.marketplaceProfile.create({
      data: {
        userId, orgId,
        userType: dto.userType,
        categories: dto.categories,
        subcategories: dto.subcategories ?? [],
        city: dto.city,
        workMode: dto.workMode ?? 'both',
        hourlyRateMin: dto.hourlyRateMin,
        hourlyRateMax: dto.hourlyRateMax ?? dto.hourlyRateMin,
        hoursBand: dto.hoursBand ?? null,
        scheduleSlots: dto.scheduleSlots ?? [],
        headline: dto.headline ?? null,
        pitchText: dto.pitchText ?? null,
        isActive: true,
      },
    });
  }

  async getProfile(userId: string, orgId: string) {
    return this.prisma.marketplaceProfile.findFirst({ where: { userId, orgId } });
  }

  async getProfileById(orgId: string, id: string, viewerUserId?: string) {
    const profile = await this.prisma.marketplaceProfile.findFirst({ where: { id, orgId } });
    if (!profile) throw new NotFoundException('Profile not found');

    // Check if there's an existing booking between viewer and this profile
    let connectionStatus: string | null = null;
    if (viewerUserId) {
      const viewerProfile = await this.prisma.marketplaceProfile.findFirst({ where: { userId: viewerUserId, orgId } });
      if (viewerProfile) {
        const existingBooking = await this.prisma.marketplaceBooking.findFirst({
          where: {
            orgId,
            OR: [
              { experiencerId: viewerProfile.id, providerId: profile.id },
              { experiencerId: profile.id, providerId: viewerProfile.id },
            ],
          },
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, date: true, totalAmount: true },
        });
        if (existingBooking) {
          connectionStatus = existingBooking.status;
        }
      }
    }

    return { ...profile, connectionStatus };
  }

  async updateProfile(userId: string, orgId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.marketplaceProfile.findFirst({ where: { userId, orgId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return this.prisma.marketplaceProfile.update({ where: { id: profile.id }, data: dto });
  }

  async searchProfiles(orgId: string, filters: any) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const where: any = { orgId, isActive: true };
    if (filters.category) where.categories = { has: filters.category };
    if (filters.city) where.city = filters.city;
    if (filters.userType) where.userType = filters.userType;

    const [items, total] = await Promise.all([
      this.prisma.marketplaceProfile.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.marketplaceProfile.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── Opportunities ──────────────────────────────────────────────────────

  async createOpportunity(providerId: string, orgId: string, dto: CreateOpportunityDto) {
    return this.prisma.opportunity.create({
      data: {
        providerId, orgId,
        title: dto.title,
        description: dto.description ?? null,
        category: dto.category,
        subcategory: dto.subcategory ?? null,
        city: dto.city,
        workMode: dto.workMode ?? 'local',
        hoursNeeded: dto.hoursNeeded,
        hourlyBudget: dto.hourlyBudget,
        scheduledDate: dto.scheduledDate ?? null,
        scheduledTime: dto.scheduledTime ?? null,
        isRecurring: dto.isRecurring ?? false,
        status: 'active',
      },
    });
  }

  async getOpportunity(id: string, orgId: string, viewerUserId?: string) {
    const opp = await this.prisma.opportunity.findFirst({
      where: { id, orgId },
      include: { provider: { select: { id: true, headline: true, city: true, avgRating: true, reviewCount: true, trustScore: true, categories: true, userId: true } } },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');

    // Check if viewer already booked this opportunity
    let connectionStatus: string | null = null;
    if (viewerUserId) {
      const viewerProfile = await this.prisma.marketplaceProfile.findFirst({ where: { userId: viewerUserId, orgId }, select: { id: true } });
      if (viewerProfile) {
        const existing = await this.prisma.marketplaceBooking.findFirst({
          where: { experienceId: id, experiencerId: viewerProfile.id, orgId },
          orderBy: { createdAt: 'desc' },
          select: { status: true },
        });
        if (existing) connectionStatus = existing.status;
      }
    }

    return { ...opp, connectionStatus };
  }

  async updateOpportunity(id: string, providerId: string, orgId: string, dto: UpdateOpportunityDto) {
    const opp = await this.prisma.opportunity.findFirst({ where: { id, providerId, orgId } });
    if (!opp) throw new NotFoundException('Opportunity not found');
    return this.prisma.opportunity.update({ where: { id }, data: dto });
  }

  async adminUpdateOpportunity(id: string, orgId: string, dto: any) {
    const opp = await this.prisma.opportunity.findFirst({ where: { id, orgId } });
    if (!opp) throw new NotFoundException('Opportunity not found');
    return this.prisma.opportunity.update({ where: { id }, data: dto });
  }

  async searchOpportunities(orgId: string, filters: any) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const where: any = { orgId, status: 'active' };
    if (filters.category) where.category = filters.category;
    if (filters.city) where.city = filters.city;

    const [items, total] = await Promise.all([
      this.prisma.opportunity.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.opportunity.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getMyOpportunities(providerId: string, orgId: string) {
    return this.prisma.opportunity.findMany({ where: { providerId, orgId }, orderBy: { createdAt: 'desc' } });
  }

  // ─── Connect (profile-to-profile without opportunity) ────────────────────

  async connectWithProfile(userId: string, orgId: string, dto: { profileId: string; date: string; startTime?: string; durationHours: number; message?: string }) {
    const myProfile = await this.prisma.marketplaceProfile.findFirst({ where: { userId, orgId } });
    if (!myProfile) throw new NotFoundException('Create your profile first');

    const targetProfile = await this.prisma.marketplaceProfile.findFirst({ where: { id: dto.profileId, orgId } });
    if (!targetProfile) throw new NotFoundException('Profile not found');

    // Determine who is experiencer and who is provider
    const iAmExperiencer = myProfile.userType === 'experiencer';
    const experiencerId = iAmExperiencer ? myProfile.id : targetProfile.id;
    const providerId = iAmExperiencer ? targetProfile.id : myProfile.id;
    const rate = iAmExperiencer ? targetProfile.hourlyRateMin : myProfile.hourlyRateMin;

    // Create a dummy opportunity for this connection
    const opp = await this.prisma.opportunity.create({
      data: {
        providerId,
        orgId,
        title: `Connection with ${iAmExperiencer ? targetProfile.headline : myProfile.headline}`,
        category: (targetProfile.categories as string[])[0] || 'general',
        city: targetProfile.city,
        workMode: 'both',
        hoursNeeded: dto.durationHours,
        hourlyBudget: rate,
        scheduledDate: dto.date,
        scheduledTime: dto.startTime ?? null,
        status: 'active',
      },
    });

    return this.prisma.marketplaceBooking.create({
      data: {
        experiencerId,
        providerId,
        experienceId: opp.id,
        orgId,
        date: dto.date,
        startTime: dto.startTime ?? null,
        durationHours: dto.durationHours,
        hourlyRate: rate,
        totalAmount: rate * dto.durationHours,
        message: dto.message ?? null,
        status: 'pending',
      },
    });
  }

  // ─── Bookings ───────────────────────────────────────────────────────────

  async createBooking(userId: string, orgId: string, dto: CreateBookingDto) {
    // Look up the user's marketplace profile (NOT the endUser UUID)
    const myProfile = await this.prisma.marketplaceProfile.findFirst({ where: { userId, orgId } });
    if (!myProfile) throw new NotFoundException('Create your profile first');

    const opp = await this.prisma.opportunity.findFirst({ where: { id: dto.opportunityId, orgId, status: 'active' } });
    if (!opp) throw new NotFoundException('Opportunity not found or closed');

    return this.prisma.marketplaceBooking.create({
      data: {
        experiencerId: myProfile.id, providerId: opp.providerId, experienceId: dto.opportunityId, orgId,
        date: dto.date, startTime: dto.startTime ?? null,
        durationHours: dto.durationHours,
        hourlyRate: opp.hourlyBudget,
        totalAmount: opp.hourlyBudget * dto.durationHours,
        message: dto.message ?? null,
        status: 'pending',
      },
    });
  }

  async updateBookingStatus(id: string, userId: string, orgId: string, dto: UpdateBookingStatusDto) {
    const myProfile = await this.prisma.marketplaceProfile.findFirst({ where: { userId, orgId }, select: { id: true } });
    if (!myProfile) throw new NotFoundException('Profile not found');

    const booking = await this.prisma.marketplaceBooking.findFirst({
      where: { id, orgId, OR: [{ experiencerId: myProfile.id }, { providerId: myProfile.id }] },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return this.prisma.marketplaceBooking.update({ where: { id }, data: { status: dto.status, note: dto.note ?? null } });
  }

  async getMyBookings(userId: string, orgId: string, role?: 'experiencer' | 'provider') {
    const myProfile = await this.prisma.marketplaceProfile.findFirst({ where: { userId, orgId }, select: { id: true } });
    if (!myProfile) return [];

    const where: any = { orgId };
    if (role === 'experiencer') where.experiencerId = myProfile.id;
    else if (role === 'provider') where.providerId = myProfile.id;
    else where.OR = [{ experiencerId: myProfile.id }, { providerId: myProfile.id }];
    return this.prisma.marketplaceBooking.findMany({ where, orderBy: { createdAt: 'desc' }, include: { experience: true } });
  }

  // ─── Reviews ────────────────────────────────────────────────────────────

  async createReview(reviewerId: string, orgId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.marketplaceBooking.findFirst({
      where: { id: dto.bookingId, orgId, status: 'completed', OR: [{ experiencerId: reviewerId }, { providerId: reviewerId }] },
    });
    if (!booking) throw new BadRequestException('Can only review completed bookings you were part of');

    return this.prisma.marketplaceReview.create({
      data: {
        bookingId: dto.bookingId, reviewerId,
        revieweeId: booking.experiencerId === reviewerId ? booking.providerId : booking.experiencerId,
        orgId, rating: dto.rating, text: dto.text ?? null,
      },
    });
  }

  async getReviewsForUser(userId: string, orgId: string) {
    return this.prisma.marketplaceReview.findMany({ where: { revieweeId: userId, orgId }, orderBy: { createdAt: 'desc' } });
  }

  // ─── Matches ────────────────────────────────────────────────────────────

  async getMatches(userId: string, orgId: string) {
    const profile = await this.prisma.marketplaceProfile.findFirst({ where: { userId, orgId } });
    if (!profile) return [];

    // Always return opportunities — the universal unit of work
    // For experiencers: opportunities that match their categories/city
    // For providers: all active opportunities (to see what experiencers are looking for)
    const where: any = { orgId, status: 'active' };

    if (profile.userType === 'experiencer') {
      // Exclude own opportunities, match by category or city
      where.OR = [
        { category: { in: profile.categories as string[] } },
        { city: profile.city },
      ];
      where.providerId = { not: profile.id };
    } else {
      // Providers see opportunities from other providers (to understand the market)
      // AND opportunities that match experiencers in their categories
      where.OR = [
        { category: { in: profile.categories as string[] } },
        { city: profile.city },
      ];
    }

    // Include provider profile info with each opportunity
    return this.prisma.opportunity.findMany({
      where,
      include: { provider: { select: { id: true, headline: true, city: true, avgRating: true, reviewCount: true, trustScore: true, categories: true, hourlyRateMin: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  // ─── Onboarding ─────────────────────────────────────────────────────────

  async saveOnboarding(userId: string, orgId: string, dto: SaveOnboardingDto) {
    const data = {
      userType: dto.userType,
      categories: dto.categories,
      subcategories: dto.subcategories ?? [],
      hourlyRateBand: dto.hourlyRateBand ?? null,
      hoursBand: dto.hoursBand ?? null,
      scheduleSlots: dto.scheduleSlots ?? [],
      city: dto.city ?? null,
      workMode: dto.workMode ?? null,
      budgetBand: dto.budgetBand ?? null,
      needWhen: dto.needWhen ?? null,
      onboardingStep: dto.onboardingStep ?? 0,
    };
    const onboarding = await this.prisma.marketplaceOnboarding.upsert({
      where: { userId_orgId: { userId, orgId } },
      create: { userId, orgId, ...data },
      update: data,
    });

    // Only create/update profile for valid user types (not connection_request etc.)
    const validUserTypes = ['experiencer', 'provider'];
    if (!validUserTypes.includes(dto.userType)) return onboarding;

    const rateMap: Record<string, number> = { '2000+': 2000, '1000-2000': 1000, '500-1000': 500, '300-500': 300, 'lt300': 200 };
    const hourlyRate = rateMap[dto.hourlyRateBand ?? ''] ?? 500;

    await this.prisma.marketplaceProfile.upsert({
      where: { userId_orgId: { userId, orgId } },
      create: {
        userId, orgId,
        userType: dto.userType,
        categories: dto.categories,
        subcategories: dto.subcategories ?? [],
        city: dto.city ?? '',
        workMode: dto.workMode ?? 'both',
        hourlyRateMin: hourlyRate,
        hourlyRateMax: hourlyRate,
        hoursBand: dto.hoursBand ?? null,
        scheduleSlots: dto.scheduleSlots ?? [],
        isActive: true,
      },
      update: {
        userType: dto.userType,
        categories: dto.categories,
        subcategories: dto.subcategories ?? [],
        ...(dto.city ? { city: dto.city } : {}),
        ...(dto.workMode ? { workMode: dto.workMode } : {}),
        ...(dto.hourlyRateBand ? { hourlyRateMin: hourlyRate, hourlyRateMax: hourlyRate } : {}),
        ...(dto.hoursBand ? { hoursBand: dto.hoursBand } : {}),
        ...(dto.scheduleSlots ? { scheduleSlots: dto.scheduleSlots } : {}),
      },
    });

    return onboarding;
  }

  async getOnboarding(userId: string, orgId: string) {
    return this.prisma.marketplaceOnboarding.findUnique({ where: { userId_orgId: { userId, orgId } } });
  }

  // ─── Admin ──────────────────────────────────────────────────────────────

  async getAdminStats(orgId: string) {
    const [totalProfiles, totalOpportunities, totalBookings, activeSubscriptions, experiencers, providers] = await Promise.all([
      this.prisma.marketplaceProfile.count({ where: { orgId } }),
      this.prisma.opportunity.count({ where: { orgId } }),
      this.prisma.marketplaceBooking.count({ where: { orgId } }),
      this.appSubscriptions.countActive(orgId),
      this.prisma.marketplaceProfile.count({ where: { orgId, userType: 'experiencer' } }),
      this.prisma.marketplaceProfile.count({ where: { orgId, userType: 'provider' } }),
    ]);
    return { totalProfiles, totalOpportunities, totalBookings, activeSubscriptions, experiencers, providers };
  }

  async adminListBookings(orgId: string, filters: any) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const where: any = { orgId };
    if (filters.status) where.status = filters.status;
    const [items, total] = await Promise.all([
      this.prisma.marketplaceBooking.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { experience: true } }),
      this.prisma.marketplaceBooking.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async adminListOnboarding(orgId: string, filters: any) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const where: any = { orgId };
    if (filters.userType) where.userType = filters.userType;
    const [items, total] = await Promise.all([
      this.prisma.marketplaceOnboarding.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.marketplaceOnboarding.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async adminListReviews(orgId: string, filters: any) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const [items, total] = await Promise.all([
      this.prisma.marketplaceReview.findMany({ where: { orgId }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.marketplaceReview.count({ where: { orgId } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
