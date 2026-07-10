import { Module } from '@nestjs/common';
import { SuperAppController } from './superapp.controller';
import { SuperAppService } from './superapp.service';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [WalletsModule],
  controllers: [SuperAppController],
  providers: [SuperAppService],
  exports: [SuperAppService],
})
export class SuperAppModule {}
