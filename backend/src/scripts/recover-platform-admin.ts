import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as readline from 'node:readline';
import { Writable } from 'node:stream';

import { PlatformAdminRecoveryService } from '../admin/platform-admin-recovery.service';
import type { PrismaService } from '../prisma/prisma.service';

const RECOVERY_CONFIRMATION = 'RESET_PLATFORM_ADMIN_PASSWORD';

const SAFE_ERROR_MESSAGES = new Set([
  'O recuperador requer um terminal interactivo autorizado.',
  'A recuperacao foi cancelada no terminal.',
  'O email da conta administrativa e obrigatorio.',
  'A confirmacao explicita da recuperacao administrativa nao corresponde.',
  'A nova palavra-passe deve ter entre 12 e 128 caracteres, incluindo maiuscula, minuscula, numero e simbolo.',
  'Use apenas o argumento opcional --reactivate.',
  'A conta administrativa indicada nao foi encontrada.',
  'A conta administrativa esta inactiva. Confirme explicitamente a reactivacao para a recuperar.',
]);

const prisma = new PrismaClient();

function assertInteractiveTerminal() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('O recuperador requer um terminal interactivo autorizado.');
  }
}

function ask(question: string, hidden = false): Promise<string> {
  const output = hidden
    ? new Writable({
        write(_chunk, _encoding, callback) {
          callback();
        },
      })
    : process.stdout;

  return new Promise((resolve, reject) => {
    if (hidden) {
      process.stdout.write(question);
    }

    const terminal = readline.createInterface({
      input: process.stdin,
      output,
      terminal: true,
    });

    const cancel = () => {
      terminal.close();
      reject(new Error('A recuperacao foi cancelada no terminal.'));
    };

    terminal.once('SIGINT', cancel);
    terminal.question(hidden ? '' : question, (answer) => {
      terminal.removeListener('SIGINT', cancel);
      terminal.close();
      if (hidden) {
        process.stdout.write('\n');
      }
      resolve(answer);
    });
  });
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
      'A nova palavra-passe deve ter entre 12 e 128 caracteres, incluindo maiuscula, minuscula, numero e simbolo.',
    );
  }
}

function readReactivationChoice() {
  const argumentsPassed = process.argv.slice(2);
  if (argumentsPassed.length === 0) return false;
  if (argumentsPassed.length === 1 && argumentsPassed[0] === '--reactivate') {
    return true;
  }

  throw new Error('Use apenas o argumento opcional --reactivate.');
}

async function recoverPlatformAdmin() {
  assertInteractiveTerminal();

  const reactivate = readReactivationChoice();
  const email = (await ask('Email da conta administrativa existente: '))
    .trim()
    .toLowerCase();
  if (!email) {
    throw new Error('O email da conta administrativa e obrigatorio.');
  }

  let password = '';
  try {
    password = await ask('Nova palavra-passe temporaria: ', true);
    const confirmation = (
      await ask('Digite RESET_PLATFORM_ADMIN_PASSWORD para confirmar: ')
    ).trim();

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
      reactivate,
    });

    console.log(
      'A credencial administrativa temporaria foi recuperada. A alteracao da palavra-passe e obrigatoria no proximo acesso.',
    );
  } finally {
    password = '';
  }
}

recoverPlatformAdmin()
  .catch((error: unknown) => {
    const message =
      error instanceof Error && SAFE_ERROR_MESSAGES.has(error.message)
        ? error.message
        : 'A conta nao foi alterada ou a transaccao foi revertida.';
    console.error(`Falha na recuperacao administrativa: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
