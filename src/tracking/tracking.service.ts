import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { UpdateTrackingStatusDto } from './dto/update-tracking.dto';
import { randomUUID } from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { trackingBus } from './stream/stream';

@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTrackingDto) {
    // optional: ensure payment exists
    const payment = await this.prisma.payment.findUnique({ where: { id: dto.payment_id } });
    if (!payment) throw new NotFoundException('Payment not found');

    return this.prisma.tracking.create({
      data: {
        id: randomUUID(),
        payment_id: dto.payment_id,
        status: dto.status,
      },
    });
  }

  async createInTx(dto: CreateTrackingDto, currentPrisma: Prisma.TransactionClient | PrismaClient = this.prisma) {
    // optional: ensure payment exists
    const payment = await currentPrisma.payment.findUnique({ where: { id: dto.payment_id } });
    if (!payment) throw new NotFoundException('Payment not found');

    return currentPrisma.tracking.create({
      data: {
        id: randomUUID(),
        payment_id: dto.payment_id,
        status: dto.status,
        location: dto.location,
      },
    });
  }

  async findById(id: string) {
    const item = await this.prisma.tracking.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Tracking not found');
    return item;
  }

  async findByPaymentId(payment_id: string) {
    const item = await this.prisma.tracking.findFirst({ where: { payment_id } });
    if (!item) throw new NotFoundException('Tracking not found');
    return item;
  }

  async updateStatus(id: string, dto: UpdateTrackingStatusDto) {
    // throws if not found
    await this.findById(id);
    console.log("update status:", dto.status);
    const tracking_data = await this.prisma.tracking.update({
      where: { id },
      data: { status: dto.status },
    });

    // event is emit by "tracking_id"
    trackingBus.emit(tracking_data.id, { type: 'update', payload: tracking_data });

    return tracking_data;
  }

  async delete(id: string) {
    // throws if not found
    await this.findById(id);
    await this.prisma.tracking.delete({ where: { id } });
    return { deleted: true };
  }
}
