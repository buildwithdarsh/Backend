import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithOrg } from '../../common/types/index.js';
import { PrismaService } from '../../database/prisma.service.js';
import { MoviesService } from './movies.service.js';
import { CreateMovieDto } from './dto/index.js';
import { SuperAdminGuard } from '../../common/guards/index.js';

@ApiTags('Admin - Movies')
@UseGuards(SuperAdminGuard)
@Controller('api/v1/admin/movies')
export class AdminMoviesController {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly prisma: PrismaService,
  ) {}

  /** Resolve orgId from X-Org-Slug header (admin routes skip JWT so req.orgId may be undefined) */
  private async resolveOrgId(req: RequestWithOrg): Promise<string> {
    if (req.orgId) return req.orgId;

    const slug = req.headers?.['x-org-slug'] as string;
    if (!slug) throw new BadRequestException('X-Org-Slug header required');

    const org = await this.prisma.organization.findUnique({ where: { slug }, select: { id: true } });
    if (!org) throw new BadRequestException('Organization not found');
    return org.id;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new movie' })
  async createMovie(@Req() req: RequestWithOrg, @Body() dto: CreateMovieDto) {
    const orgId = await this.resolveOrgId(req);
    return this.moviesService.createMovie(orgId, dto);
  }

  // ─── Stream Mappings (TMDB → GDrive) ───────────────────────────────────────

  @Get('stream-mappings')
  @ApiOperation({ summary: 'List all movie stream mappings' })
  async listStreamMappings(@Req() req: RequestWithOrg) {
    const orgId = await this.resolveOrgId(req);
    return this.moviesService.getAllStreamMappings(orgId);
  }

  @Post('stream-mappings')
  @ApiOperation({ summary: 'Create or update a movie stream mapping' })
  async upsertStreamMapping(
    @Req() req: RequestWithOrg,
    @Body() body: { tmdbId: number; title: string; gdriveFileId: string; source?: string },
  ) {
    const orgId = await this.resolveOrgId(req);
    return this.moviesService.upsertStreamMapping(orgId, body.tmdbId, {
      title: body.title,
      gdriveFileId: body.gdriveFileId,
      ...(body.source !== undefined && { source: body.source }),
    });
  }

  @Delete('stream-mappings/:tmdbId')
  @ApiOperation({ summary: 'Delete a movie stream mapping' })
  async deleteStreamMapping(@Req() req: RequestWithOrg, @Param('tmdbId') tmdbId: string) {
    const orgId = await this.resolveOrgId(req);
    return this.moviesService.deleteStreamMapping(orgId, Number(tmdbId));
  }
}
