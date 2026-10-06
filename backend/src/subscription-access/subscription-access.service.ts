import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

@Injectable()
export class SubscriptionAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(tenantId: string, now = new Date()) {
    const [tenant, activeSubscription, latestSubscription] =
      await this.prisma.$transaction([
        this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: {
            id: true,
            status: true,
            planType: true,
            trialEndsAt: true,
            createdAt: true,
          },
        }),
        this.prisma.subscription.findFirst({
          where: {
            tenantId,
            isActive: true,
            paymentStatus: 'PAID',
            startsAt: { lte: now },
            endsAt: { gt: now },
          },
          orderBy: { endsAt: 'desc' },
          select: {
            id: true,
            planType: true,
            startsAt: true,
            endsAt: true,
            paymentStatus: true,
          },
        }),
        this.prisma.subscription.findFirst({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            planType: true,
            startsAt: true,
            endsAt: true,
            paymentStatus: true,
            isActive: true,
          },
        }),
      ]);

    if (!tenant) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    const trialActive =
      tenant.status === 'TRIAL' &&
      tenant.trialEndsAt !== null &&
      tenant.trialEndsAt.getTime() > now.getTime();
    const trialExpired =
      tenant.status === 'TRIAL' &&
      tenant.trialEndsAt !== null &&
      tenant.trialEndsAt.getTime() <= now.getTime();

    let state:
      | 'SUSPENDED'
      | 'SUBSCRIPTION_ACTIVE'
      | 'TRIAL_ACTIVE'
      | 'TRIAL_EXPIRED'
      | 'SUBSCRIPTION_REQUIRED';
    let commercialAccess = false;

    if (tenant.status === 'SUSPENDED') {
      state = 'SUSPENDED';
    } else if (activeSubscription) {
      state = 'SUBSCRIPTION_ACTIVE';
      commercialAccess = true;
    } else if (trialActive) {
      state = 'TRIAL_ACTIVE';
      commercialAccess = true;
    } else if (trialExpired) {
      state = 'TRIAL_EXPIRED';
    } else {
      state = 'SUBSCRIPTION_REQUIRED';
    }

    const millisecondsRemaining = tenant.trialEndsAt
      ? Math.max(0, tenant.trialEndsAt.getTime() - now.getTime())
      : 0;

    return {
      evaluatedAt: now.toISOString(),
      state,
      commercialAccess,
      enforcement: {
        status: 'PREPARED_NOT_APPLIED',
        message:
          'O estado comercial é calculado no backend, mas o bloqueio global aguarda a definição de planos e funcionalidades essenciais.',
      },
      plan: {
        current: activeSubscription?.planType ?? tenant.planType,
        activeSubscriptionId: activeSubscription?.id ?? null,
        startsAt: activeSubscription?.startsAt ?? null,
        endsAt: activeSubscription?.endsAt ?? null,
      },
      trial: {
        startedAt: tenant.createdAt,
        endsAt: tenant.trialEndsAt,
        daysRemaining: trialActive
          ? Math.ceil(millisecondsRemaining / DAY_IN_MILLISECONDS)
          : 0,
      },
      latestPayment: latestSubscription
        ? {
            status: latestSubscription.paymentStatus,
            planType: latestSubscription.planType,
            startsAt: latestSubscription.startsAt,
            endsAt: latestSubscription.endsAt,
            subscriptionActive: latestSubscription.isActive,
          }
        : null,
    };
  }
}
