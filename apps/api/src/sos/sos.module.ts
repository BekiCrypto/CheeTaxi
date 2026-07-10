import { Module } from '@nestjs/common';
import { SosController } from './sos.controller';
import { SosService } from './sos.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  controllers: [SosController],
  providers: [SosService, NotificationsService],
  exports: [SosService],
})
export class SosModule {}
