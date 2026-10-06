import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FiscalRegime, TaxRegimeAssignmentStatus, TaxType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FiscalEnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.taxRegimeAssignment.findMany({ where: { tenantId }, orderBy: [{ taxType: 'asc' }, { validFrom: 'desc' }] });
  }

  async resolve(tenantId: string, taxType: TaxType, period: Date) {
    return this.prisma.taxRegimeAssignment.findFirst({
      where: { tenantId, taxType, status: 'ACTIVE', validFrom: { lte: period }, OR: [{ validUntil: null }, { validUntil: { gte: period } }] },
      orderBy: { validFrom: 'desc' },
    });
  }

  async create(tenantId: string, data: { taxType: TaxType; regime: FiscalRegime; validFrom: string; validUntil?: string; legalReference?: string; officialSourceUrl?: string; sourceDiploma?: string; sourceArticle?: string; }) {
    const validFrom = new Date(data.validFrom);
    const validUntil = data.validUntil ? new Date(data.validUntil) : null;
    if (Number.isNaN(validFrom.getTime()) || (validUntil && validUntil < validFrom)) throw new BadRequestException('Vigência fiscal inválida.');
    const overlap = await this.prisma.taxRegimeAssignment.findFirst({ where: { tenantId, taxType: data.taxType, status: 'ACTIVE', validFrom: { lte: validUntil ?? new Date('9999-12-31') }, OR: [{ validUntil: null }, { validUntil: { gte: validFrom } }] } });
    if (overlap) throw new BadRequestException('Já existe um enquadramento activo sobreposto para este imposto.');
    return this.prisma.taxRegimeAssignment.create({ data: { ...data, tenantId, validFrom, validUntil, status: TaxRegimeAssignmentStatus.ACTIVE, reviewStatus: TaxRegimeAssignmentStatus.REVIEW_REQUIRED, decisionDate: new Date(), decisionType: 'MANUAL_REVIEW_REQUIRED' } });
  }

  async end(tenantId: string, id: string, validUntil: string) {
    const enrollment = await this.prisma.taxRegimeAssignment.findFirst({ where: { id, tenantId } });
    if (!enrollment) throw new NotFoundException('Enquadramento fiscal não encontrado.');
    const end = new Date(validUntil);
    if (Number.isNaN(end.getTime()) || end < enrollment.validFrom) throw new BadRequestException('Fim de vigência inválido.');
    return this.prisma.taxRegimeAssignment.update({ where: { id }, data: { validUntil: end, status: 'INACTIVE' } });
  }
}
