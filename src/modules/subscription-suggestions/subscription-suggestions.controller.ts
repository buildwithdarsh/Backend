import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetOrg, GetEndUser } from '../../common/decorators/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { SubscriptionSuggestionsService } from './subscription-suggestions.service.js';
import { QuerySuggestionsDto, SuggestionActionBodyDto } from './dto/index.js';

@ApiTags('Storefront - Subscription Suggestions')
@Controller('api/v1/storefront/subscription-suggestions')
@UseGuards(EndUserJwtGuard)
export class SubscriptionSuggestionsController {
  constructor(private readonly service: SubscriptionSuggestionsService) {}

  @Get()
  @ApiOperation({ summary: 'List pending suggestions' })
  async list(
    @GetOrg() orgId: string,
    @GetEndUser('id') endUserId: string,
    @Query() query: QuerySuggestionsDto,
  ) {
    return this.service.findAll(orgId, endUserId, query);
  }

  @Post(':id/action')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Act on a suggestion (accept / dismiss / not_interested)' })
  async action(
    @GetOrg() orgId: string,
    @GetEndUser('id') endUserId: string,
    @Param('id') suggestionId: string,
    @Body() body: SuggestionActionBodyDto,
  ) {
    return this.service.applyAction(orgId, endUserId, suggestionId, body.action);
  }
}
