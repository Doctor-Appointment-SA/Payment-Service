import { TrackingStatus } from "@prisma/client";

export class Tracking {
  id!: string;
  payment_id!: string | null;
  status!: TrackingStatus | null;
  // add timestamps if you have them in schema
}