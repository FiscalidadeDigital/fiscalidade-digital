import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

const COMPANY_SELECT = {
  id: true,
  name: true,
  nif: true,
  email: true,
  phone: true,
  address: true,
  sector: true,
  status: true,
  planType: true,
  trialEndsAt: true,
  createdAt: true,
  updatedAt: true,
  regime: true,
  companyType: true,
  employeeCount: true,
  retentionRate: true,
} satisfies Prisma.TenantSelect;

@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getCompany(tenantId: string) {
    const company =
      await this.prisma.tenant.findUnique({
        where: {
          id: tenantId,
        },
        select: COMPANY_SELECT,
      });

    if (!company) {
      throw new NotFoundException(
        'Empresa não encontrada',
      );
    }

    return company;
  }

  async updateCompany(
    tenantId: string,
    body: UpdateCompanyDto,
  ) {
    const company =
      await this.prisma.tenant.findUnique({
        where: {
          id: tenantId,
        },
      });

    if (!company) {
      throw new NotFoundException(
        'Empresa não encontrada',
      );
    }

    return this.prisma.tenant.update({
      where: {
        id: tenantId,
      },
      select: COMPANY_SELECT,

      data: {
        name: typeof body.name === 'string' ? body.name.trim() || undefined : undefined,
        nif: typeof body.nif === 'string' ? body.nif.trim() || undefined : undefined,
        email: typeof body.email === 'string' ? body.email.trim().toLowerCase() || undefined : undefined,
        phone: typeof body.phone === 'string' ? body.phone.trim() || null : undefined,
        address: typeof body.address === 'string' ? body.address.trim() || null : undefined,
        sector: typeof body.sector === 'string' ? body.sector.trim() || null : undefined,
        companyType: body.companyType || undefined,
        employeeCount: body.employeeCount,
        regime: body.regime,
      },
    });
  }
}
