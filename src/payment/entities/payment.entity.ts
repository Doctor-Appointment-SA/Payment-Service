import { PaymentMethod, PaymentStatus } from "@prisma/client";

export class Payment {
  id: string;
  prescription_id: string;
  cost: number | null;
  status: PaymentStatus;
  method: PaymentMethod | null;
  created_at: Date | null;
}

export class Prescription {
  id: string;
  patient_id: string | null;
  doctor_id: string | null;
  status: string | null;
  created_at: Date | null;
}
