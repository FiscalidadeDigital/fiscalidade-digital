import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function readRequiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} tem de estar definida.`);
  }
  return value;
}

function validatePassword(password: string) {
  if (
    password.length < 12 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    throw new Error(
      'ADMIN_BOOTSTRAP_PASSWORD deve ter pelo menos 12 caracteres, incluindo maiúscula, minúscula, número e símbolo.',
    );
  }
}

async function bootstrapPlatformAdmin() {
  const email = readRequiredEnvironment('ADMIN_BOOTSTRAP_EMAIL').toLowerCase();
  const password = readRequiredEnvironment('ADMIN_BOOTSTRAP_PASSWORD');
  const name = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || 'Administrador';

  validatePassword(password);

  const existingAdmins = await prisma.platformAdmin.count();
  if (existingAdmins > 0) {
    throw new Error(
      'O bootstrap foi recusado porque já existe uma conta administrativa.',
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.$transaction(async (tx) => {
    const created = await tx.platformAdmin.create({
      data: {
        email,
        password: passwordHash,
        name,
        mustChangePassword: true,
      },
    });

    await tx.platformAuditLog.create({
      data: {
        adminId: created.id,
        action: 'ADMIN_BOOTSTRAPPED',
      },
    });

    return created;
  });

  console.log(`Conta administrativa criada para ${admin.email}.`);
  console.log('A alteração da palavra-passe é obrigatória no primeiro acesso.');
}

bootstrapPlatformAdmin()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Erro desconhecido.';
    console.error(`Falha no bootstrap administrativo: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
