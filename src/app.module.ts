import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentModule } from './payment/payment.module';
import { TrackingModule } from './tracking/tracking.module';

@Module({
  imports: [PaymentModule, TrackingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
