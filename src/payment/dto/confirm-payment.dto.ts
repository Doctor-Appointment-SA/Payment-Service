import { IsString, IsBoolean } from 'class-validator';

export class ConfirmPaymentDto {
  @IsBoolean()
  delivery: boolean;

  @IsString()
  location: string;
}
