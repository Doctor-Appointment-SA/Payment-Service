import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentModule } from './payment/payment.module';
import { TrackingModule } from './tracking/tracking.module';
import { ConfigModule } from '@nestjs/config';
import { jwtConfig } from './config/jwt.config';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PaymentModule, TrackingModule, ConfigModule.forRoot({ isGlobal: true, load: [jwtConfig] }), AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
