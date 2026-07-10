import { Module } from '@nestjs/common';
import { CarbonController } from './carbon.controller';
import { CarbonService } from './carbon.service';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [WalletsModule],
  controllers: [CarbonController],
  providers: [CarbonService],
  exports: [CarbonService],
})
export class CarbonModule {}
