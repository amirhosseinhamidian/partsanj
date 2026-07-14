import './instrument.js';

import { ConsoleLogger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor.js';
import { requestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { captureServerException } from './common/monitoring/sentry-monitoring.js';

const isProduction = process.env.NODE_ENV === 'production';

const applicationLogger = new ConsoleLogger({
  context: 'PartSanj',
  json: isProduction,
  colors: !isProduction,
  compact: true,
  logLevels: isProduction
    ? ['log', 'warn', 'error', 'fatal']
    : ['log', 'warn', 'error', 'debug', 'verbose', 'fatal'],
});

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: applicationLogger,
  });

  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT', 3001);
  const webUrl = configService.get<string>('WEB_URL', 'http://localhost:3000');
  const nodeEnv = configService.get<string>('NODE_ENV', process.env.NODE_ENV ?? 'development');
  const enableSwagger = configService.get<string>('ENABLE_SWAGGER', 'false') === 'true';

  /**
   * باید قبل از route handlerها و فیلتر سراسری اجرا شود
   * تا تمام پاسخ‌های موفق و ناموفق requestId داشته باشند.
   */
  app.use(requestIdMiddleware);

  app.enableShutdownHooks();

  app.enableCors({
    origin: webUrl
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
    exposedHeaders: ['x-request-id'],
  });

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new HttpLoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  /**
   * Swagger در Production فقط با ENABLE_SWAGGER=true
   * فعال می‌شود.
   */
  if (nodeEnv !== 'production' || enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('PartSanj API')
      .setDescription('API documentation for the PartSanj auto parts platform')
      .setVersion('1.0.0')
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('docs', app, swaggerDocument, {
      useGlobalPrefix: true,
      customSiteTitle: 'PartSanj API Docs',
    });
  }

  await app.listen(port);

  applicationLogger.log({
    event: 'application_started',
    service: 'partsanj-api',
    environment: nodeEnv,
    port,
  });
}

bootstrap().catch(async (error: unknown) => {
  applicationLogger.error({
    event: 'application_bootstrap_failed',
    service: 'partsanj-api',
    environment: process.env.NODE_ENV ?? 'development',
    error: {
      name: error instanceof Error ? error.name : 'UnknownError',
      stack: error instanceof Error ? error.stack : String(error),
    },
  });

  captureServerException(error, {
    event: 'application_bootstrap_failed',
    level: 'fatal',
  });

  const Sentry = await import('@sentry/nestjs');
  await Sentry.flush(2_000);

  process.exit(1);
});
