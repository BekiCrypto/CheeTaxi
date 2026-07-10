import { Module } from '@nestjs/common';
import { SosController } from './sos.controller';
import { SosService } from './sos.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  controllers: [SosController],
  providers: [SosService, NotificationsService],
  exports: [SosService],
})
export class SosModule {}
