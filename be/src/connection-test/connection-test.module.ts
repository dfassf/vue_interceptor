import { Module } from '@nestjs/common';
import { ConnectionTestController } from './controllers/connection-test.controller';
import { ConnectionTestService } from './services/connection-test.service';

@Module({
  controllers: [ConnectionTestController],
  providers: [ConnectionTestService],
  exports: [ConnectionTestService],
})
export class ConnectionTestModule {} 