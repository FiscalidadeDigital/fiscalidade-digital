import {
  PrismaClient,
  UserRole,
  TenantStatus,
  PlanType,
  ObligationType,
  ObligationStatus,
} from '@prisma/client';

import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // =====================================================
  // TENANT DEMO
  // =====================================================

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Empresa Demo Lda',
      nif: '5000123456',
      email: 'demo@empresa.ao',
      phone: '+244923000001',
      address: 'Luanda',
      sector: 'Comércio',
      status: TenantStatus.ACTIVE,
      planType: PlanType.BASIC,
    },
  });

  // =====================================================
  // USERS
  // =====================================================

  const passwordHash = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Administrador',
      email: 'admin@empresa.ao',
      password: passwordHash,
      role: UserRole.OWNER,
    },
  });

  const accountant = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Contabilista',
      email: 'contabilista@empresa.ao',
      password: passwordHash,
      role: UserRole.ACCOUNTANT,
    },
  });

  // =====================================================
  // SUBSCRIPTION
  // =====================================================

  await prisma.subscription.create({
    data: {
      tenantId: tenant.id,
      planType: PlanType.BASIC,
      priceKwanza: 15000,
      startsAt: new Date(),
      endsAt: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ),
      isActive: true,
      paymentRef: 'REF-2026-0001',
    },
  });

  // =====================================================
  // OBRIGAÇÕES FISCAIS 2026
  // =====================================================

  const obligations = [
    {
      tenantId: tenant.id,
      type: ObligationType.IVA,
      title: 'IVA Julho 2026',
      description: 'Declaração e pagamento de IVA',
      dueDate: new Date(2026, 6, 15),
      amount: 450000,
      status: ObligationStatus.PENDING,
    },

    {
      tenantId: tenant.id,
      type: ObligationType.IRT,
      title: 'IRT Julho 2026',
      description: 'IRT dos trabalhadores',
      dueDate: new Date(2026, 6, 7),
      amount: 125000,
      status: ObligationStatus.PENDING,
    },

    {
      tenantId: tenant.id,
      type: ObligationType.SS,
      title: 'Segurança Social Julho 2026',
      description: 'Contribuições segurança social',
      dueDate: new Date(2026, 6, 10),
      amount: 87500,
      status: ObligationStatus.PENDING,
    },

    {
      tenantId: tenant.id,
      type: ObligationType.II,
      title: 'Imposto Industrial 2026',
      description: 'Pagamento por conta',
      dueDate: new Date(2026, 6, 31),
      amount: 310000,
      status: ObligationStatus.PENDING,
    },

    {
      tenantId: tenant.id,
      type: ObligationType.DECLARACAO,
      title: 'Declaração Anual 2026',
      description: 'Declaração Anual de Rendimentos',
      dueDate: new Date(2026, 11, 31),
      amount: 0,
      status: ObligationStatus.PENDING,
    },
  ];

  for (const obligation of obligations) {
    await prisma.fiscalObligation.create({
      data: obligation,
    });
  }

  console.log(
    `✅ ${obligations.length} obrigações fiscais criadas`,
  );

  // =====================================================
  // CREDENCIAIS
  // =====================================================

  console.log('\n=================================');
  console.log('🚀 FISCALIDADE DIGITAL DEMO');
  console.log('=================================');
  console.log(
    `👤 Admin: ${admin.email} | Password: 123456`,
  );
  console.log(
    `👤 Contabilista: ${accountant.email} | Password: 123456`,
  );
  console.log('=================================');

  console.log('✅ Seed concluído');
}

main()
  .catch((error) => {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });