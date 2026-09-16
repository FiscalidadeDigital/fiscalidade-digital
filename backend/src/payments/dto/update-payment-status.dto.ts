import {
  IsEnum,
} from 'class-validator';

export enum PaymentStatusUpdate {
  PAID = 'PAID',
}

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatusUpdate)
  status: PaymentStatusUpdate;
}