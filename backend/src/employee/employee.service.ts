import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateEmployeeSalaryDto } from './dto/create-employee-salary.dto';
import { CreateEmployeeDependentDto } from './dto/create-employee-dependent.dto';

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

            dependentCount:
              dto.dependentCount ??
              0,

            notes:
              dto.notes?.trim() ||
              null,
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
    dto: CreateEmployeeDto,
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
        name:
          dto.name.trim(),

        nif:
          dto.nif?.trim() ||
          null,

        socialSecurityNumber:
          dto.socialSecurityNumber
            ?.trim() ||
          null,

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

        dependentCount:
          dto.dependentCount ??
          0,

        notes:
          dto.notes?.trim() ||
          null,
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

    return this.prisma.employee.delete({
      where: {
        id,
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
        await transaction.employeeSalary.updateMany({
          where: {
            employeeId,
            active: true,
          },

          data: {
            active: false,
            effectiveTo: new Date(),
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
              new Date(
                dto.effectiveFrom,
              ),

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

        if (taxDependent) {
          await transaction.employee.update({
            where: {
              id: employeeId,
            },

            data: {
              dependentCount: {
                increment: 1,
              },
            },
          });
        }

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