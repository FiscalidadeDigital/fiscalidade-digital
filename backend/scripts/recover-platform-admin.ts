import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PlatformAdminRecoveryService } from '../src/admin/platform-admin-recovery.service';
import type { PrismaService } from '../src/prisma/prisma.service';

const RECOVERY_CONFIRMATION = 'RESET_PLATFORM_ADMIN_PASSWORD';

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
    password.length > 128 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    throw new Error(
      'ADMIN_RECOVERY_PASSWORD deve ter entre 12 e 128 caracteres, incluindo maiuscula, minuscula, numero e simbolo.',
    );
  }
}

function readReactivationChoice() {
  const value = process.env.ADMIN_RECOVERY_REACTIVATE?.trim().toLowerCase();
  if (!value || value === 'false') return false;
  if (value === 'true') return true;
  throw new Error('ADMIN_RECOVERY_REACTIVATE deve ser true ou false.');
}

async function recoverPlatformAdmin() {
  const email = readRequiredEnvironment('ADMIN_RECOVERY_EMAIL').toLowerCase();
  const password = readRequiredEnvironment('ADMIN_RECOVERY_PASSWORD');
  const confirmation = readRequiredEnvironment('ADMIN_RECOVERY_CONFIRMATION');

  if (confirmation !== RECOVERY_CONFIRMATION) {
    throw new Error(
      'A confirmacao explicita da recuperacao administrativa nao corresponde.',
    );
  }

  validatePassword(password);

  const service = new PlatformAdminRecoveryService(
    prisma as unknown as PrismaService,
  );
  await service.recover({
    email,
    passwordHash: await bcrypt.hash(password, 12),
    reactivate: readReactivationChoice(),
  });

  console.log(
    'A credencial administrativa temporaria foi recuperada. A alteracao da palavra-passe e obrigatoria no proximo acesso.',
  );
}

recoverPlatformAdmin()
  .catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : 'Erro desconhecido.';
    console.error(`Falha na recuperacao administrativa: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
