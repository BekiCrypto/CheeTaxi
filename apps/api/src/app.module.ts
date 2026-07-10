import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma.module';
import { RedisModule } from './common/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PassengersModule } from './passengers/passengers.module';
import { DriversModule } from './drivers/drivers.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { FleetsModule } from './fleets/fleets.module';
import { TripsModule } from './trips/trips.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { PricingModule } from './pricing/pricing.module';
import { GeoModule } from './geo/geo.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { WalletsModule } from './wallets/wallets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SosModule } from './sos/sos.module';
import { SupportModule } from './support/support.module';
import { RatingsModule } from './ratings/ratings.module';
import { PromotionsModule } from './promotions/promotions.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { StatsModule } from './stats/stats.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ObservabilityModule } from './observability/observability.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { SuperAppModule } from './superapp/superapp.module';
import { AiModule } from './ai/ai.module';
import { AvModule } from './av/av.module';
import { ComplianceModule } from './compliance/compliance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: 600 },  // 600 req/min/IP — generous for mobile clients
      { ttl: 1_000, limit: 30 },     // 30 req/sec/IP burst
    ]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    PassengersModule,
    DriversModule,
    VehiclesModule,
    FleetsModule,
    TripsModule,
    DispatchModule,
    PricingModule,
    GeoModule,
    SubscriptionsModule,
    PaymentsModule,
    WalletsModule,
    NotificationsModule,
    SosModule,
    SupportModule,
    RatingsModule,
    PromotionsModule,
    AuditModule,
    HealthModule,
    StatsModule,
    RealtimeModule,
    ObservabilityModule,
    AnalyticsModule,
    WebhooksModule,
    SuperAppModule,
    AiModule,
    AvModule,
    ComplianceModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
