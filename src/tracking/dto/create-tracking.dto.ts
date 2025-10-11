import { TrackingStatus } from "@prisma/client";
import { IsOptional, IsUUID } from "class-validator";

export class CreateTrackingDto {
  @IsUUID()
  payment_id!: string;

  @IsOptional()
  status?: TrackingStatus; // default handled in service
}