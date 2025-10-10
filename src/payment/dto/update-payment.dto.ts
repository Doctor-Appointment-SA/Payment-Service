import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePaymentDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;
}
