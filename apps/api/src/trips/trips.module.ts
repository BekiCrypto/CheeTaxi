import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { DispatchService } from '../dispatch/dispatch.service';
import { PricingService } from '../pricing/pricing.service';
import { GeoService } from '../geo/geo.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [RealtimeModule, WebhooksModule],
  controllers: [TripsController],
  providers: [TripsService, DispatchService, PricingService, GeoService, NotificationsService],
  exports: [TripsService],
})
export class TripsModule {}
