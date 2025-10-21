import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TrackingModule } from 'src/tracking/tracking.module';

@Module({
  imports: [PrismaModule, TrackingModule],
  controllers: [PaymentController],
  providers: [PaymentService]
})
export class PaymentModule {}

     
