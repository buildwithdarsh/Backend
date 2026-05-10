import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TmdbModule } from '../../services/tmdb/tmdb.module.js';
import { GDriveModule } from '../../services/gdrive/gdrive.module.js';
import { MoviesService } from './movies.service.js';
import { StorefrontMoviesController, StorefrontWatchlistController } from './storefront-movies.controller.js';
import { AdminMoviesController } from './admin-movies.controller.js';
import { TmdbMoviesController } from './tmdb-movies.controller.js';

@Module({
  imports: [TmdbModule, GDriveModule, JwtModule.register({})],
  controllers: [
    StorefrontMoviesController,
    StorefrontWatchlistController,
    AdminMoviesController,
    TmdbMoviesController,
  ],
  providers: [MoviesService],
  exports: [MoviesService],
})
export class MoviesModule {}
