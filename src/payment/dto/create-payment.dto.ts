import { PaymentMethod } from '@prisma/client';
import { IsUUID, IsNumber, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  prescription_id: string;

  @IsNumber()
  @Min(0)
  cost: number;

  @IsString()
  method: PaymentMethod;
}
