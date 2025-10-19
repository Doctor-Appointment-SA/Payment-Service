import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Payment, Prescription } from './entities/payment.entity';
import {
  PaymentStatus,
  Prisma,
  PrismaClient,
  TrackingStatus,
} from '@prisma/client';
import { TrackingService } from 'src/tracking/tracking.service';
import { Tracking } from 'src/tracking/entities/tracking.entity';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { UpdateTrackingStatusDto } from 'src/tracking/dto/update-tracking.dto';
import { paymentBus } from './stream/stream';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingService: TrackingService,
  ) {}

  async create(dto: CreatePaymentDto, user_id: string): Promise<Payment> {
    // first verify ownership
    console.log('prescription_id', dto.prescription_id, ' user_id', user_id);
    const found = await this.prisma.prescription.findFirst({
      where: { id: dto.prescription_id, patient_id: user_id },
      select: { id: true },
    });
    if (!found)
      throw new ForbiddenException('You do not own this prescription');

    // create the payment
    const payment = await this.prisma.payment.create({
      data: {
        id: randomUUID(), // If your Prisma schema has default: uuid(), you can omit this
        prescription_id: dto.prescription_id,
        cost: dto.cost,
        status: PaymentStatus.PENDING, // stored as string (text) in DB
        method: dto.method,
        created_at: new Date(), // if schema has @default(now()), you can omit this
      },
    });

    // Auto-expire after 60 seconds (If it was still "PENDING" after 60 sec, turn it to "CANCEL")
    let tick = 0;
    const ticker = setInterval(async () => {
      tick++;

      // ping every 1 second for 60 times
      const remaining = Math.max(0, 60 - tick);
      paymentBus.emit(payment.id, { type: 'ping-ttl', payload: remaining });

      // after 60 sec, CANCEL the payment, and push that to frontend
      if (tick >= 60) {
        clearInterval(ticker);
        // only remove, if the record is in PENDING
        const remove = await this.removeIfPending(payment.id);

        if (remove.ok) {
          paymentBus.emit(payment.id, {
            type: 'remove',
            payload: { prescription_id: remove.prescription_id },
          });
        } else {
          paymentBus.emit(payment.id, { type: 'remove-failed' });
        }
      }
    }, 1000);

    return payment;
  }

  async findOne(id: string): Promise<Payment> {
    const p = await this.prisma.payment.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Payment not found');
    return p;
  }

  async findOnePrescription(prescription_id: string): Promise<Prescription> {
    const p = await this.prisma.prescription.findUnique({
      where: { id: prescription_id },
      include: {
        prescription_item: {
          include: {
            medication: true,
          },
        },
      },
    });
    if (!p) throw new NotFoundException('Prescription not found');
    return p;
  }

  async update(id: string, dto: UpdatePaymentDto): Promise<Payment> {
    return this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.findUnique({ where: { id } });
      if (!p) throw new NotFoundException('Payment not found');
      if (p.status !== PaymentStatus.PENDING) {
        throw new BadRequestException('Only pending payments can be edited');
      }

      return tx.payment.update({
        where: { id },
        data: {
          ...(dto.cost !== undefined ? { cost: dto.cost } : {}),
        },
      });
    });
  }

  async cancel(id: string): Promise<Payment> {
    return this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.findUnique({ where: { id } });
      if (!p) throw new NotFoundException('Payment not found');
      if (p.status !== PaymentStatus.PENDING) {
        throw new BadRequestException('Only pending payments can be canceled');
      }

      return tx.payment.update({
        where: { id },
        data: { status: PaymentStatus.CANCEL },
      });
    });
  }

  async pay(
    id: string,
    dto: ConfirmPaymentDto,
    user_id: string,
  ): Promise<{ payment_data: Payment; tracking_data: Tracking | null }> {
    // verify ownership
    const found = await this.prisma.payment.findFirst({
      where: {
        id: id,
        prescription: {
          patient_id: user_id,
        },
      },
      select: { id: true },
    });
    if (!found)
      throw new ForbiddenException('You do not own this prescription');

    return this.prisma.$transaction(async (tx) => {
      const delivery = dto.delivery;
      const location = dto.location;
      // Update status to Success (only if it's still pending)
      const { count } = await tx.payment.updateMany({
        where: { id, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.SUCCESS, created_at: new Date() },
      });

      if (count === 0) {
        const exists = await tx.payment.findUnique({
          where: { id },
          select: { status: true },
        });

        if (!exists) throw new NotFoundException('Payment not found');
        throw new BadRequestException('Only pending payments can be paid');
      }

      // Create tracking record
      var tracking_data: Tracking | null = null;
      if (delivery) {
        tracking_data = await this.trackingService.createInTx(
          {
            payment_id: id,
            status: TrackingStatus.PREPARE,
            location: location,
          },
          tx,
        );

        // update delivery with setting time
        this.fakeDeliveryProgress(tracking_data.id);
      }

      // Fetch updated payment
      const payment_data: Payment = await this.payInTx(id, tx);

      return { payment_data, tracking_data };
    });
  }

  private async fakeDeliveryProgress(tracking_id: string) {
    const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

    // PREPARE -> SENDING (after 10s)
    await wait(10_000);
    const send_dto: UpdateTrackingStatusDto = {
      status: TrackingStatus.SENDING,
    };
    await this.trackingService.updateStatus(tracking_id, send_dto);

    // SENDING -> SUCCESS (after 20s)
    await wait(10_000);
    const send_dto2: UpdateTrackingStatusDto = {
      status: TrackingStatus.SUCCESS,
    };
    await this.trackingService.updateStatus(tracking_id, send_dto2);
  }

  async payInTx(
    id: string,
    currentPrisma: Prisma.TransactionClient | PrismaClient = this.prisma,
  ): Promise<Payment> {
    const payment_data: Payment = await currentPrisma.payment.findUniqueOrThrow(
      {
        where: { id },
      },
    );
    return payment_data;
  }

  async remove(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }

    const prescription_id = payment?.prescription_id;

    await this.prisma.payment.delete({
      where: { id },
    });

    return {
      message: `Payment with id ${id} has been deleted successfully`,
      prescription_id: prescription_id,
    };
  }

  async removeIfPending(
    id: string,
  ): Promise<{ ok: boolean; prescription_id?: string }> {
    return this.prisma.$transaction(async (tx) => {
      const rec = await tx.payment.findUnique({
        where: { id },
        select: { prescription_id: true, status: true },
      });

      if (!rec || rec.status !== PaymentStatus.PENDING) {
        return { ok: false };
      }

      // Atomic guard: only delete if still PENDING
      const { count } = await tx.payment.deleteMany({
        where: { id, status: PaymentStatus.PENDING },
      });

      if (count === 0) return { ok: false };
      return { ok: true, prescription_id: rec.prescription_id };
    });
  }
}
