import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { WalletsModule } from '../wallets/wallets.module';
import { GeoModule } from '../geo/geo.module';

@Module({
  imports: [WalletsModule, GeoModule],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
