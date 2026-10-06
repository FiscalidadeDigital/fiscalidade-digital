import { IsUUID } from 'class-validator';

export class CreatePurchaseInvoiceImportDto {
  @IsUUID()
  documentId!: string;
}
