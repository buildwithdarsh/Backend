import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, type NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from '../dist/src/app.module.js';

let cachedExpress: Express | null = null;

async function bootstrap(): Promise<Express> {
  if (cachedExpress) return cachedExpress;

  const expressApp = express();
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(expressApp),
    { logger: ['error', 'warn', 'log'] },
  );

  const configService = app.get(ConfigService);

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  app.use(
    (
      req: { query?: Record<string, unknown> },
      _res: unknown,
      next: () => void,
    ) => {
      if (req.query) {
        for (const key of Object.keys(req.query)) {
          if (key.endsWith('[]')) {
            const clean = key.slice(0, -2);
            req.query[clean] = req.query[key];
            delete req.query[key];
          }
        }
      }
      next();
    },
  );

  const corsOrigins = configService.get<string[]>('cors.origins') ?? [];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (/^https:\/\/([a-z0-9-]+\.)*withdarsh\.com$/.test(origin)) return callback(null, true);
      if (/^https:\/\/([a-z0-9-]+\.)*techzunction\.com$/.test(origin)) return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Org-Slug',
      'X-Org-Key',
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();
  cachedExpress = expressApp;
  return expressApp;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  const server = await bootstrap();
  server(req, res);
}
