import { Module } from '@nestjs/common';
import { AvController } from './av.controller';
import { AvService } from './av.service';

@Module({
  controllers: [AvController],
  providers: [AvService],
  exports: [AvService],
})
export class AvModule {}
