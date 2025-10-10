import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

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
  pay(@Param('id') id: string) {
    return this.paymentService.pay(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentService.remove(id);
  }
}
