import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getCompany(
    tenantId: string,
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

    return company;
  }

  async updateCompany(
    tenantId: string,
    body: any,
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

      data: {
        name: body.name,
        nif: body.nif,
        email: body.email,
        phone: body.phone,
        address: body.address,
        sector: body.sector,
        companyType: body.companyType,
        employees: body.employees,
        regime: body.regime,
        retentionRate:
          body.retentionRate,
      },
    });
  }
}