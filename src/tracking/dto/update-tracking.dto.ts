import { TrackingStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateTrackingStatusDto {
  @IsEnum(TrackingStatus)
  status!: TrackingStatus;
}
