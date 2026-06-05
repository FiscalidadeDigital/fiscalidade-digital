import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  private readonly openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async chat(
    tenantId: string,
    message: string,
  ) {
    try {
      const company =
        await this.prisma.tenant.findUnique({
          where: {
            id: tenantId,
          },
        });

      if (!company) {
        return {
          answer: 'Empresa não encontrada.',
        };
      }

      const completion =
        await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',

          messages: [
            {
              role: 'system',
              content: `
És Fiscalidade AI.

Especialista em:

- Fiscalidade Angolana
- IVA
- IRT
- Imposto Industrial
- Segurança Social
- Contabilidade
- Gestão Empresarial

Empresa:
${company.name}
`,
            },

            {
              role: 'user',
              content: message,
            },
          ],

          temperature: 0.3,
        });

      return {
        answer:
          completion.choices[0].message.content,
      };
    } catch (error: any) {
      console.log(error);

      return {
        answer: this.getFallbackAnswer(message),
      };
    }
  }

  private getFallbackAnswer(
    question: string,
  ) {
    const q = question.toLowerCase();

    if (q.includes('iva')) {
      return `
O IVA em Angola possui taxa normal de 14%.

Fórmula:

IVA = Valor × 14%

Exemplo:

100.000 AOA × 14%
=
14.000 AOA
`;
    }

    if (
      q.includes('segurança social') ||
      q.includes('inss')
    ) {
      return `
Segurança Social:

Empregador:
8%

Trabalhador:
3%

Total:
11%
`;
    }

    if (
      q.includes('imposto industrial')
    ) {
      return `
O Imposto Industrial em Angola possui taxa geral de 25%.

Consulte sempre a legislação atualizada.
`;
    }

    return `
Sou a Fiscalidade AI.

Posso ajudar com:

• IVA
• IRT
• Imposto Industrial
• Segurança Social
• Obrigações fiscais
• Prazos da AGT
• Contabilidade
• Gestão financeira
`;
  }
}