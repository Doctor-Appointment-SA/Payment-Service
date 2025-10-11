import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { UpdateTrackingStatusDto } from './dto/update-tracking.dto';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  // POST /tracking
  @Post()
  create(@Body() dto: CreateTrackingDto) {
    return this.trackingService.create(dto);
  }

  // GET /tracking/:id
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.trackingService.findById(id);
  }

  // GET /tracking?payment_id=xxxx
  @Get()
  findByPayment(@Query('payment_id') payment_id: string) {
    return this.trackingService.findByPaymentId(payment_id);
  }

  // PATCH /tracking/:id/status
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTrackingStatusDto) {
    return this.trackingService.updateStatus(id, dto);
  }

  // DELETE /tracking/:id
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.trackingService.delete(id);
  }
}
