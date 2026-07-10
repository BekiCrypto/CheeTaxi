import { Module } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { HeatMapService } from './heatmap.service';
import { DispatchController } from './dispatch.controller';
import { GeoModule } from '../geo/geo.module';

@Module({
  imports: [GeoModule],
  providers: [DispatchService, HeatMapService],
  controllers: [DispatchController],
  exports: [DispatchService, HeatMapService],
})
export class DispatchModule {}
