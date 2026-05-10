import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { QuerySuggestionsDto, SuggestionActionDto } from './dto/index.js';

@Injectable()
export class SubscriptionSuggestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string, endUserId: string, query: QuerySuggestionsDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.subscriptionSuggestion.findMany({
        where: { orgId, endUserId, status: 'pending' },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          suggestionType: true,
          title: true,
          description: true,
          savingsPaise: true,
          alternativeServiceName: true,
          alternativeAmountPaise: true,
          affiliateUrl: true,
          status: true,
          createdAt: true,
          trackedSubscription: {
            select: {
              id: true,
              serviceName: true,
              logoUrl: true,
              amountPaise: true,
              billingCycle: true,
              category: true,
            },
          },
        },
      }),
      this.prisma.subscriptionSuggestion.count({
        where: { orgId, endUserId, status: 'pending' },
      }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async applyAction(
    orgId: string,
    endUserId: string,
    suggestionId: string,
    action: SuggestionActionDto,
  ) {
    const suggestion = await this.prisma.subscriptionSuggestion.findFirst({
      where: { id: suggestionId, orgId, endUserId },
    });

    if (!suggestion) throw new NotFoundException('Suggestion not found');

    const now = new Date();
    await this.prisma.subscriptionSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: action,
        ...(action === 'accepted' ? { acceptedAt: now } : { dismissedAt: now }),
      },
    });

    return { message: `Suggestion marked as ${action}` };
  }
}
