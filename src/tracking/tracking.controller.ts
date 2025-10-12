import { Body, Controller, Delete, Get, MessageEvent, Param, Patch, Post, Query, Sse } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { UpdateTrackingStatusDto } from './dto/update-tracking.dto';
import { Observable } from 'rxjs';
import { trackingBus } from './stream/stream';

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

  @Sse('stream/:tracking_id')
  async stream(@Param('tracking_id') tracking_id: string): Promise<Observable<MessageEvent>> {
    const current = await this.trackingService.findById(tracking_id);

    return new Observable<MessageEvent>((subscriber) => {
      // send this event msg to subsciber - for initiate the connection to frontend
      subscriber.next({ data: JSON.stringify({ type: 'init', payload: current }) });

      // continuously send event msg to subscriber
      const onUpdate = (event_data: any) => {
        subscriber.next({ data: JSON.stringify(event_data) });
      };
      // this basically said that => listen to event that happen on "tracking_id" => if it found that event happen, "onUpdate" is called
      trackingBus.on(tracking_id, onUpdate);

      // keep sending the msg to subscribeer every 15 sec => to keep connection alive
      const hb = setInterval(() => {
        subscriber.next({ data: JSON.stringify({ type: 'ping' }) });
      }, 5000);

      // close the connection to frontend
      return () => {
        clearInterval(hb);
        trackingBus.off(tracking_id, onUpdate);
      };
    });
  }

}
