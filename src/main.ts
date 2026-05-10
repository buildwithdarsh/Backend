import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // ─── Security Middleware ──────────────────────────────────────────────
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // ─── Normalize bracket-notation query params (tags[] → tags) ────────
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

  // ─── CORS ─────────────────────────────────────────────────────────────
  const corsOrigins = configService.get<string[]>('cors.origins') ?? [];
  const isProduction = configService.get<string>('nodeEnv') === 'production';
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (server-to-server, mobile apps)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Allow all *.withdarsh.com subdomains (work, build, aurajs, api, dev-api, etc.)
      if (/^https:\/\/([a-z0-9-]+\.)*withdarsh\.com$/.test(origin)) {
        callback(null, true);
        return;
      }

      // Allow all *.techzunction.com subdomains (legacy)
      if (/^https:\/\/([a-z0-9-]+\.)*techzunction\.com$/.test(origin)) {
        callback(null, true);
        return;
      }

      // Allow localhost only in non-production environments
      if (
        !isProduction &&
        (/^https?:\/\/localhost(:\d+)?$/.test(origin) ||
         /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin))
      ) {
        callback(null, true);
      } else if (corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
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

  // ─── Global Validation Pipe ───────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── Swagger Documentation (disabled in production) ──────────────────
  const nodeEnv = configService.get<string>('nodeEnv');
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Darsh Gupta API')
      .setDescription(
        'Multi-tenant SaaS backend API for notifications, campaigns, payments, and more.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
        'JWT',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          description: 'Enter your API key',
        },
        'API-Key',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  // ─── Graceful Shutdown ────────────────────────────────────────────────
  app.enableShutdownHooks();

  // ─── Start Listening ──────────────────────────────────────────────────
  const port = configService.get<number>('port') ?? 3000;
  await app.listen(port);

  console.log(`Application running on http://localhost:${port}`);
  if (nodeEnv !== 'production') {
    console.log(`Swagger docs at http://localhost:${port}/api/docs`);
  }
}

void bootstrap();
