import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { MoviesService } from './movies.service.js';
import { QueryMoviesDto } from './dto/index.js';

@ApiTags('Storefront - Movies')
@Controller('api/v1/storefront/movies')
export class StorefrontMoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List movies with filters' })
  findAll(@Req() req: RequestWithOrg, @Query() query: QueryMoviesDto) {
    return this.moviesService.findAll(req.orgId, query);
  }

  @Public()
  @Get('hero-banners')
  @ApiOperation({ summary: 'Get active hero banners' })
  getHeroBanners(@Req() req: RequestWithOrg) {
    return this.moviesService.getHeroBanners(req.orgId);
  }

  @Public()
  @Get('genres')
  @ApiOperation({ summary: 'Get genre categories' })
  getGenres(@Req() req: RequestWithOrg) {
    return this.moviesService.getGenres(req.orgId);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get movie detail by slug' })
  findBySlug(@Req() req: RequestWithOrg, @Param('slug') slug: string) {
    return this.moviesService.findBySlug(req.orgId, slug);
  }

  // ─── Authenticated (EndUser) ────────────────────────────────────────────────

  @UseGuards(EndUserJwtGuard)
  @Get('library')
  @ApiOperation({ summary: 'Get user library' })
  getLibrary(@Req() req: RequestWithOrg) {
    return this.moviesService.getUserLibrary(req.orgId, req.endUser!.id);
  }

  @UseGuards(EndUserJwtGuard)
  @Get(':id/stream')
  @ApiOperation({ summary: 'Get stream URL (checks entitlement)' })
  getStream(@Req() req: RequestWithOrg, @Param('id') id: string) {
    return this.moviesService.getStreamUrl(req.orgId, req.endUser!.id, id);
  }

  @UseGuards(EndUserJwtGuard)
  @Post(':id/progress')
  @ApiOperation({ summary: 'Update watch progress' })
  updateProgress(
    @Req() req: RequestWithOrg,
    @Param('id') id: string,
    @Body() body: { progressSec: number; durationSec: number },
  ) {
    return this.moviesService.updateWatchProgress(
      req.orgId, req.endUser!.id, id, body.progressSec, body.durationSec,
    );
  }

  @UseGuards(EndUserJwtGuard)
  @Post(':id/rent')
  @ApiOperation({ summary: 'Create rental entitlement' })
  rentMovie(@Req() req: RequestWithOrg, @Param('id') id: string) {
    // Price will be validated on payment callback — this is a simplified flow
    return this.moviesService.createEntitlement(req.orgId, req.endUser!.id, id, 'rent', 0);
  }

  @UseGuards(EndUserJwtGuard)
  @Post(':id/buy')
  @ApiOperation({ summary: 'Create purchase entitlement' })
  buyMovie(@Req() req: RequestWithOrg, @Param('id') id: string) {
    return this.moviesService.createEntitlement(req.orgId, req.endUser!.id, id, 'buy', 0);
  }
}

// ─── Watchlist Controller ─────────────────────────────────────────────────────

@ApiTags('Storefront - Watchlist')
@Controller('api/v1/storefront/watchlist')
@UseGuards(EndUserJwtGuard)
export class StorefrontWatchlistController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @ApiOperation({ summary: 'Get watchlist' })
  getWatchlist(@Req() req: RequestWithOrg) {
    return this.moviesService.getWatchlist(req.orgId, req.endUser!.id);
  }

  @Post(':catalogItemId')
  @ApiOperation({ summary: 'Add to watchlist' })
  addToWatchlist(@Req() req: RequestWithOrg, @Param('catalogItemId') catalogItemId: string) {
    return this.moviesService.addToWatchlist(req.orgId, req.endUser!.id, catalogItemId);
  }

  @Delete(':catalogItemId')
  @ApiOperation({ summary: 'Remove from watchlist' })
  removeFromWatchlist(@Req() req: RequestWithOrg, @Param('catalogItemId') catalogItemId: string) {
    return this.moviesService.removeFromWatchlist(req.orgId, req.endUser!.id, catalogItemId);
  }
}
