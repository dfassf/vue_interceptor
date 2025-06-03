import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConnectionTestModule } from './connection-test/connection-test.module';

@Module({
  imports: [ConnectionTestModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
