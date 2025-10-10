import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Payment, Prescription } from './entities/payment.entity';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto): Promise<Payment> {
    return this.prisma.payment.create({
      data: {
        id: randomUUID(),                        // If your Prisma schema has default: uuid(), you can omit this
        prescription_id: dto.prescription_id,
        cost: dto.cost,
        status: PaymentStatus.PENDING,           // stored as string (text) in DB
        method: dto.method,
        created_at: new Date(),                   // if schema has @default(now()), you can omit this
      },
    });
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

  async pay(id: string): Promise<Payment> {
    return this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.findUnique({ where: { id } });
      if (!p) throw new NotFoundException('Payment not found');
      if (p.status !== PaymentStatus.PENDING) {
        throw new BadRequestException('Only pending payments can be paid');
      }

      return tx.payment.update({
        where: { id },
        data: { status: PaymentStatus.SUCCESS },
      });
    });
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

    return { message: `Payment with id ${id} has been deleted successfully`, prescription_id: prescription_id };
  }
}
