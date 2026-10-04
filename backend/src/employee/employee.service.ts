import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateEmployeeSalaryDto } from './dto/create-employee-salary.dto';
import { CreateEmployeeDependentDto } from './dto/create-employee-dependent.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateRemunerationComponentDto } from './dto/create-remuneration-component.dto';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================================================
  // GERAR PRÓXIMO NÚMERO DO FUNCIONÁRIO
  //
  // Formato:
  // 001
  // 002
  // 003
  // ...
  //
  // A numeração é independente para cada empresa.
  // =========================================================

  private async getNextEmployeeNumber(
    tenantId: string,
    transaction?: any,
  ): Promise<string> {
    const prisma =
      transaction || this.prisma;

    const employees =
      await prisma.employee.findMany({
        where: {
          tenantId,
          employeeNumber: {
            not: null,
          },
        },

        select: {
          employeeNumber: true,
        },
      });

    let highestNumber = 0;

    for (const employee of employees) {
      if (!employee.employeeNumber) {
        continue;
      }

      /*
       * Aceita números antigos como:
       *
       * 001
       * 002
       * 005
       *
       * Também consegue interpretar:
       *
       * FUNC-001
       * FUNC-002
       *
       * caso existam dados antigos.
       */

      const match =
        employee.employeeNumber.match(
          /(\d+)\s*$/,
        );

      if (!match) {
        continue;
      }

      const number =
        Number(match[1]);

      if (
        Number.isInteger(number) &&
        number > highestNumber
      ) {
        highestNumber = number;
      }
    }

    const nextNumber =
      highestNumber + 1;

    return String(
      nextNumber,
    ).padStart(3, '0');
  }

  // =========================================================
  // FUNCIONÁRIOS
  // =========================================================

  async create(
    tenantId: string,
    dto: CreateEmployeeDto,
  ) {
    /*
     * Usamos uma transação para evitar que duas criações
     * simultâneas da mesma empresa recebam o mesmo número.
     *
     * PostgreSQL permite um advisory lock por empresa.
     */

    return this.prisma.$transaction(
      async (transaction) => {
        await transaction.$executeRaw`
          SELECT pg_advisory_xact_lock(
            hashtext(${tenantId})
          )
        `;

        const employeeNumber =
          await this.getNextEmployeeNumber(
            tenantId,
            transaction,
          );

        return transaction.employee.create({
          data: {
            tenantId,

            name:
              dto.name.trim(),

            /*
             * IMPORTANTE:
             * O número NÃO vem do frontend.
             * O backend gera automaticamente.
             */
            employeeNumber,

            nif:
              dto.nif?.trim() ||
              null,

            socialSecurityNumber:
              dto.socialSecurityNumber
                ?.trim() ||
              null,

            socialSecurityCategory:
              dto.socialSecurityCategory ??
              'STANDARD',

            email:
              dto.email?.trim() ||
              null,

            phone:
              dto.phone?.trim() ||
              null,

            address:
              dto.address?.trim() ||
              null,

            birthDate:
              dto.birthDate
                ? new Date(
                    dto.birthDate,
                  )
                : null,

            hireDate:
              dto.hireDate
                ? new Date(
                    dto.hireDate,
                  )
                : null,

            terminationDate:
              dto.terminationDate
                ? new Date(
                    dto.terminationDate,
                  )
                : null,

            jobTitle:
              dto.jobTitle?.trim() ||
              null,

            department:
              dto.department?.trim() ||
              null,

            maritalStatus:
              dto.maritalStatus?.trim() ||
              null,

            gender:
              dto.gender?.trim() ||
              null,

            status:
              dto.status ??
              'ACTIVE',

            // Dependentes são a fonte de verdade; este campo é um contador
            // denormalizado somente para compatibilidade e snapshots.
            dependentCount: 0,

            notes:
              dto.notes?.trim() ||
              null,

            ...(dto.initialSalary && {
              salaries: {
                create: {
                  baseSalary: dto.initialSalary.baseSalary,
                  foodAllowance:
                    dto.initialSalary.foodAllowance ??
                    0,
                  transportAllowance:
                    dto.initialSalary.transportAllowance ??
                    0,
                  otherAllowances:
                    dto.initialSalary.otherAllowances ??
                    0,
                  bonuses:
                    dto.initialSalary.bonuses ??
                    0,
                  commissions:
                    dto.initialSalary.commissions ??
                    0,
                  otherIncome:
                    dto.initialSalary.otherIncome ??
                    0,
                  effectiveFrom: new Date(
                    dto.initialSalary.effectiveFrom,
                  ),
                  active: true,
                  notes:
                    dto.initialSalary.notes?.trim() ||
                    null,
                },
              },
            }),
          },

          include: {
            salaries: {
              orderBy: {
                effectiveFrom:
                  'desc',
              },
            },

            dependents: {
              orderBy: {
                name: 'asc',
              },
            },
          },
        });
      },
    );
  }

  // =========================================================
  // LISTAR FUNCIONÁRIOS DA EMPRESA AUTENTICADA
  // =========================================================

  async findAll(
    tenantId: string,
  ) {
    return this.prisma.employee.findMany({
      where: {
        tenantId,
      },

      include: {
        salaries: {
          where: {
            active: true,
          },

          orderBy: {
            effectiveFrom:
              'desc',
          },

          take: 1,
        },

        dependents: {
          where: {
            taxDependent: true,
          },

          orderBy: {
            name: 'asc',
          },
        },
      },

      orderBy: {
        name: 'asc',
      },
    });
  }

  // =========================================================
  // OBTER FUNCIONÁRIO
  // =========================================================

  async findOne(
    tenantId: string,
    id: string,
  ) {
    const employee =
      await this.prisma.employee.findFirst({
        where: {
          id,
          tenantId,
        },

        include: {
          salaries: {
            orderBy: {
              effectiveFrom:
                'desc',
            },
          },

          dependents: {
            orderBy: {
              name: 'asc',
            },
          },

          remunerationComponents: {
            orderBy: { effectiveFrom: 'desc' },
          },

          payrollItems: {
            orderBy: {
              createdAt:
                'desc',
            },

            take: 12,
          },
        },
      });

    if (!employee) {
      throw new NotFoundException(
        'Funcionário não encontrado.',
      );
    }

    return employee;
  }

  // =========================================================
  // ATUALIZAR FUNCIONÁRIO
  // =========================================================

  async update(
    tenantId: string,
    id: string,
    dto: UpdateEmployeeDto,
  ) {
    const employee =
      await this.prisma.employee.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!employee) {
      throw new NotFoundException(
        'Funcionário não encontrado.',
      );
    }

    /*
     * employeeNumber NÃO é alterado.
     *
     * Exemplo:
     *
     * FUNCIONÁRIO Nº 005
     *
     * Alterou o cargo?
     * Continua Nº 005.
     *
     * Alterou o nome?
     * Continua Nº 005.
     *
     * Alterou o salário?
     * Continua Nº 005.
     */

    return this.prisma.employee.update({
      where: {
        id,
      },

      data: {
        ...(dto.name !== undefined && {
          name: dto.name.trim(),
        }),
        ...(dto.nif !== undefined && {
          nif: dto.nif?.trim() || null,
        }),
        ...(dto.socialSecurityNumber !== undefined && {
          socialSecurityNumber:
            dto.socialSecurityNumber?.trim() || null,
        }),
        ...(dto.socialSecurityCategory !== undefined && {
          socialSecurityCategory: dto.socialSecurityCategory,
        }),
        ...(dto.email !== undefined && {
          email: dto.email?.trim() || null,
        }),
        ...(dto.phone !== undefined && {
          phone: dto.phone?.trim() || null,
        }),
        ...(dto.address !== undefined && {
          address: dto.address?.trim() || null,
        }),
        ...(dto.birthDate !== undefined && {
          birthDate: dto.birthDate
            ? new Date(dto.birthDate)
            : null,
        }),
        ...(dto.hireDate !== undefined && {
          hireDate: dto.hireDate
            ? new Date(dto.hireDate)
            : null,
        }),
        ...(dto.terminationDate !== undefined && {
          terminationDate: dto.terminationDate
            ? new Date(dto.terminationDate)
            : null,
        }),
        ...(dto.jobTitle !== undefined && {
          jobTitle: dto.jobTitle?.trim() || null,
        }),
        ...(dto.department !== undefined && {
          department: dto.department?.trim() || null,
        }),
        ...(dto.maritalStatus !== undefined && {
          maritalStatus: dto.maritalStatus?.trim() || null,
        }),
        ...(dto.gender !== undefined && {
          gender: dto.gender?.trim() || null,
        }),
        ...(dto.notes !== undefined && {
          notes: dto.notes?.trim() || null,
        }),
        ...(dto.status !== undefined && {
          status: dto.status,
        }),
      },
    });
  }

  // =========================================================
  // REMOVER FUNCIONÁRIO
  // =========================================================

  async remove(
    tenantId: string,
    id: string,
  ) {
    const employee =
      await this.prisma.employee.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!employee) {
      throw new NotFoundException(
        'Funcionário não encontrado.',
      );
    }

    // Não há remoção física: relações laborais e folhas históricas precisam
    // continuar auditáveis. A reactivação exige fluxo administrativo explícito.
    return this.prisma.employee.update({
      where: {
        id,
      },
      data: {
        status: 'ARCHIVED',
      },
    });
  }

  // =========================================================
  // SALÁRIOS
  // =========================================================

  async addSalary(
    tenantId: string,
    employeeId: string,
    dto: CreateEmployeeSalaryDto,
  ) {
    const employee =
      await this.prisma.employee.findFirst({
        where: {
          id: employeeId,
          tenantId,
        },
      });

    if (!employee) {
      throw new NotFoundException(
        'Funcionário não encontrado.',
      );
    }

    return this.prisma.$transaction(
      async (transaction) => {
        const effectiveFrom = new Date(dto.effectiveFrom);
        const currentSalary =
          await transaction.employeeSalary.findFirst({
            where: {
              employeeId,
              active: true,
            },
            orderBy: {
              effectiveFrom: 'desc',
            },
          });

        if (
          currentSalary &&
          effectiveFrom <= currentSalary.effectiveFrom
        ) {
          throw new BadRequestException(
            'A nova vigência salarial deve ser posterior à vigência activa.',
          );
        }

        await transaction.employeeSalary.updateMany({
          where: {
            employeeId,
            active: true,
          },

          data: {
            active: false,
            effectiveTo: effectiveFrom,
          },
        });

        return transaction.employeeSalary.create({
          data: {
            employeeId,

            baseSalary:
              dto.baseSalary,

            foodAllowance:
              dto.foodAllowance ??
              0,

            transportAllowance:
              dto.transportAllowance ??
              0,

            otherAllowances:
              dto.otherAllowances ??
              0,

            bonuses:
              dto.bonuses ??
              0,

            commissions:
              dto.commissions ??
              0,

            otherIncome:
              dto.otherIncome ??
              0,

            effectiveFrom:
              effectiveFrom,

            active: true,

            notes:
              dto.notes?.trim() ||
              null,
          },
        });
      },
    );
  }

  // =========================================================
  // HISTÓRICO DE SALÁRIOS
  // =========================================================

  async getSalaries(
    tenantId: string,
    employeeId: string,
  ) {
    const employee =
      await this.prisma.employee.findFirst({
        where: {
          id: employeeId,
          tenantId,
        },
      });

    if (!employee) {
      throw new NotFoundException(
        'Funcionário não encontrado.',
      );
    }

    return this.prisma.employeeSalary.findMany({
      where: {
        employeeId,
      },

      orderBy: {
        effectiveFrom:
          'desc',
      },
    });
  }

  async addRemunerationComponent(tenantId: string, employeeId: string, dto: CreateRemunerationComponentDto) {
    await this.findOne(tenantId, employeeId);
    const inssTreatment = dto.type === 'HOLIDAY_ALLOWANCE' ? 'EXCLUDED' : 'NEEDS_OFFICIAL_CONFIRMATION';
    return this.prisma.employeeRemunerationComponent.create({
      data: {
        employeeId,
        type: dto.type,
        amount: dto.amount,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        inssTreatment,
        notes: dto.notes?.trim() || null,
        legalReference: dto.type === 'HOLIDAY_ALLOWANCE' ? 'Decreto Presidencial n.º 227/18, arts. 12.º–14.º' : null,
      },
    });
  }

  async getRemunerationComponents(tenantId: string, employeeId: string) {
    await this.findOne(tenantId, employeeId);
    return this.prisma.employeeRemunerationComponent.findMany({
      where: { employeeId }, orderBy: [{ effectiveFrom: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async endRemunerationComponent(tenantId: string, employeeId: string, componentId: string, effectiveTo: string) {
    const component = await this.prisma.employeeRemunerationComponent.findFirst({
      where: { id: componentId, employeeId, employee: { tenantId } },
    });
    if (!component) throw new NotFoundException('Componente remuneratório não encontrado.');
    if (component.effectiveTo) throw new BadRequestException('Este componente já possui fim de vigência.');
    const end = new Date(effectiveTo);
    if (Number.isNaN(end.getTime()) || end < component.effectiveFrom) {
      throw new BadRequestException('A data de fim deve ser igual ou posterior ao início da vigência.');
    }
    return this.prisma.employeeRemunerationComponent.update({
      where: { id: component.id }, data: { effectiveTo: end },
    });
  }

  // =========================================================
  // DEPENDENTES
  // =========================================================

  async addDependent(
    tenantId: string,
    employeeId: string,
    dto: CreateEmployeeDependentDto,
  ) {
    const employee =
      await this.prisma.employee.findFirst({
        where: {
          id: employeeId,
          tenantId,
        },
      });

    if (!employee) {
      throw new NotFoundException(
        'Funcionário não encontrado.',
      );
    }

    return this.prisma.$transaction(
      async (transaction) => {
        const taxDependent =
          dto.taxDependent ??
          true;

        const dependent =
          await transaction.employeeDependent.create({
            data: {
              employeeId,

              name:
                dto.name.trim(),

              relationship:
                dto.relationship
                  ?.trim() ||
                null,

              birthDate:
                dto.birthDate
                  ? new Date(
                      dto.birthDate,
                    )
                  : null,

              taxDependent,
            },
          });

        const dependentCount = await transaction.employeeDependent.count({
          where: { employeeId, taxDependent: true },
        });
        await transaction.employee.update({
          where: { id: employeeId },
          data: { dependentCount },
        });

        return dependent;
      },
    );
  }

  // =========================================================
  // LISTAR DEPENDENTES
  // =========================================================

  async getDependents(
    tenantId: string,
    employeeId: string,
  ) {
    const employee =
      await this.prisma.employee.findFirst({
        where: {
          id: employeeId,
          tenantId,
        },
      });

    if (!employee) {
      throw new NotFoundException(
        'Funcionário não encontrado.',
      );
    }

    return this.prisma.employeeDependent.findMany({
      where: {
        employeeId,
      },

      orderBy: {
        name: 'asc',
      },
    });
  }
}
