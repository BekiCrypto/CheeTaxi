import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { initTracing, shutdownTracing } from './observability/tracing';
import { initSentry, flushSentry } from './observability/sentry';

// Initialize OpenTelemetry BEFORE importing NestJS modules
initTracing();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const logger = new Logger('Bootstrap');

  // Initialize Sentry error tracking (no-op if SENTRY_DSN is not set)
  if (initSentry()) {
    logger.log('Sentry error tracking initialized');
  }

  const port = process.env.API_PORT ? Number(process.env.API_PORT) : 4000;
  const env = process.env.NODE_ENV ?? 'development';

  // Security headers
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // CORS — allow web + mobile clients
  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3001,http://localhost:3002')
    .split(',')
    .map((s) => s.trim());
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter + interceptors (metrics first so it captures timing for all)
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new MetricsInterceptor(app.get('MetricsService')), new LoggingInterceptor());

  // Swagger / OpenAPI docs
  if (env !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('CheeTaxi API')
      .setDescription('The most modern mobility platform designed for Africa.')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication & identity')
      .addTag('users', 'User management')
      .addTag('passengers', 'Passenger profile & saved places')
      .addTag('drivers', 'Driver onboarding & status')
      .addTag('vehicles', 'Vehicle registration & verification')
      .addTag('fleets', 'Corporate / government fleet management')
      .addTag('trips', 'Trip lifecycle: request, accept, complete, cancel')
      .addTag('dispatch', 'Real-time dispatch engine')
      .addTag('pricing', 'Fare estimates & surge pricing')
      .addTag('geo', 'Geocoding, places, geofences')
      .addTag('subscriptions', 'Driver subscription plans')
      .addTag('payments', 'Payment processing (modular)')
      .addTag('wallets', 'Driver / passenger / fleet wallets')
      .addTag('notifications', 'Push / SMS / email notifications')
      .addTag('sos', 'Safety SOS alerts')
      .addTag('support', 'Support tickets & live chat')
      .addTag('ratings', 'Ratings & reviews')
      .addTag('promotions', 'Promo codes & referrals')
      .addTag('audit', 'Audit logs')
      .addTag('stats', 'Platform statistics')
      .addTag('health', 'Health checks')
      .addTag('metrics', 'Prometheus metrics')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`📚 Swagger docs: http://localhost:${port}/docs`);
  }

  // Graceful shutdown — flush traces + Sentry events
  app.enableShutdownHooks();
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received — flushing telemetry...');
    await flushSentry();
    await shutdownTracing();
  });

  await app.listen(port);
  logger.log(`🚀 CheeTaxi API running on http://localhost:${port} [${env}]`);
  logger.log(`📊 Prometheus metrics: http://localhost:${port}/metrics`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal bootstrap error', err);
  process.exit(1);
});
