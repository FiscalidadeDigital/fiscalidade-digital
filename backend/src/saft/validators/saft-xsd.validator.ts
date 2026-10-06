import { Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

type ValidationResult = {
  valid: boolean;
  kind: 'TECHNICAL_XSD_VALIDATION';
  errors: string[];
};

@Injectable()
export class SaftXsdValidator {
  async validate(xml: string): Promise<ValidationResult> {
    const schemaPath = this.firstExisting([
      join(process.cwd(), 'src', 'saft', 'schemas', 'SAFTAO1.01_01.xsd'),
      join(process.cwd(), 'dist', 'saft', 'schemas', 'SAFTAO1.01_01.xsd'),
      join(__dirname, '..', 'schemas', 'SAFTAO1.01_01.xsd'),
    ]);
    const workerPath = this.firstExisting([
      join(process.cwd(), 'src', 'saft', 'validators', 'xsd-validation.worker.mjs'),
      join(process.cwd(), 'dist', 'saft', 'validators', 'xsd-validation.worker.mjs'),
      join(__dirname, 'xsd-validation.worker.mjs'),
    ]);
    if (!schemaPath || !workerPath) {
      return { valid: false, kind: 'TECHNICAL_XSD_VALIDATION', errors: ['XSD SAF-T AO ou worker de validação não encontrado no runtime.'] };
    }

    return new Promise<ValidationResult>((resolve) => {
      const child = spawn(process.execPath, [workerPath, schemaPath], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      });
      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => child.kill(), 30_000);
      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      child.stdout.on('data', (chunk) => { stdout += chunk; });
      child.stderr.on('data', (chunk) => { stderr += chunk; });
      child.on('error', (error) => {
        clearTimeout(timer);
        resolve({ valid: false, kind: 'TECHNICAL_XSD_VALIDATION', errors: [error.message] });
      });
      child.on('close', () => {
        clearTimeout(timer);
        try {
          const parsed = JSON.parse(stdout) as { valid: boolean; errors?: string[] };
          resolve({ valid: parsed.valid, kind: 'TECHNICAL_XSD_VALIDATION', errors: parsed.errors ?? [] });
        } catch {
          resolve({ valid: false, kind: 'TECHNICAL_XSD_VALIDATION', errors: [stderr.trim() || 'Resposta inválida do validador XSD.'] });
        }
      });
      child.stdin.end(xml, 'utf8');
    });
  }

  private firstExisting(paths: string[]) {
    return paths.find((candidate) => existsSync(candidate));
  }
}
