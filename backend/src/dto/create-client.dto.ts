export class CreateClientDto {
  name!: string;

  nif?: string;

  email?: string;

  phone?: string;

  address?: string;

  tenantId!: string;
}