import {
  Body,
  Controller,
  Delete,
  Get,
  MessageEvent,
  Param,
  Patch,
  Post,
  Sse,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { Observable } from 'rxjs';
import { paymentBus } from './stream/stream';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // Create payment when prescription is created -> status "pending"
  @Post('create')
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentService.create(dto);
  }

  // Read single (handy for testing)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  // Read single (handy for testing)
  @Get('prescription/:id')
  findOnePrescription(@Param('id') id: string) {
    return this.paymentService.findOnePrescription(id);
  }

  // Edit (amount / currency) – only while pending
  @Patch('update/:id')
  update(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.paymentService.update(id, dto);
  }

  // Cancel -> status "cancel"
  @Patch('cancel/:id')
  cancel(@Param('id') id: string) {
    return this.paymentService.cancel(id);
  }

  // Pay -> status "success" - only when "pending"
  @Patch('pay/:id')
  pay(@Param('id') id: string, @Body() dto: ConfirmPaymentDto) {
    return this.paymentService.pay(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentService.remove(id);
  }

  @Sse('stream/:payment_id')
  async stream(
    @Param('payment_id') payment_id: string,
  ): Promise<Observable<MessageEvent>> {
    const current = await this.paymentService.findOne(payment_id);

    return new Observable<MessageEvent>((subscriber) => {
      // send this event msg to subsciber - for initiate the connection to frontend
      subscriber.next({
        data: JSON.stringify({ type: 'init', payload: current }),
      });

      // continuously send event msg to subscriber
      const onUpdate = (event_data: any) => {
        subscriber.next({ data: JSON.stringify(event_data) });
      };
      // this basically said that => listen to event that happen on "payment_id" => if it found that event happen, "onUpdate" is called
      paymentBus.on(payment_id, onUpdate);

      // keep sending the msg to subscribeer every 15 sec => to keep connection alive
      const hb = setInterval(() => {
        subscriber.next({ data: JSON.stringify({ type: 'ping' }) });
      }, 5000);

      // close the connection to frontend
      return () => {
        clearInterval(hb);
        paymentBus.off(payment_id, onUpdate);
      };
    });
  }
}
