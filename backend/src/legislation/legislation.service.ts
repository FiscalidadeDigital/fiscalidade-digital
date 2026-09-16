import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import {
  LegislationCategory,
  TaxType,
} from '@prisma/client';

@Injectable()
export class LegislationService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =====================================================
  // ORDENACAO PADRAO
  // =====================================================

  private readonly defaultOrder = [
    {
      publicationDate: 'desc' as const,
    },
    {
      createdAt: 'desc' as const,
    },
  ];

  // =====================================================
  // LISTAR TODA A LEGISLACAO
  // =====================================================

  async findAll() {
    return this.prisma.legislation.findMany({
      where: {
        active: true,
      },

      orderBy: this.defaultOrder,
    });
  }

  // =====================================================
  // BUSCAR POR ID
  // =====================================================

  async findOne(id: string) {
    const legislation =
      await this.prisma.legislation.findUnique({
        where: {
          id,
        },
      });

    if (!legislation) {
      throw new NotFoundException(
        'Legislação não encontrada.',
      );
    }

    return legislation;
  }

  // =====================================================
  // PESQUISAR
  // =====================================================

  async search(query: string) {
    const search = String(query || '').trim();

    if (!search) {
      return this.findAll();
    }

    return this.prisma.legislation.findMany({
      where: {
        active: true,

        OR: [
          {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },

          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },

          {
            content: {
              contains: search,
              mode: 'insensitive',
            },
          },

          {
            lawNumber: {
              contains: search,
              mode: 'insensitive',
            },
          },

          {
            article: {
              contains: search,
              mode: 'insensitive',
            },
          },

          {
            subject: {
              contains: search,
              mode: 'insensitive',
            },
          },

          {
            source: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      },

      orderBy: this.defaultOrder,
    });
  }

  // =====================================================
  // FILTRAR POR CATEGORIA
  // =====================================================

  async findByCategory(category: string) {
    const value = String(category || '')
      .trim()
      .toUpperCase();

    const validCategory =
      Object.values(LegislationCategory).includes(
        value as LegislationCategory,
      );

    if (!validCategory) {
      return [];
    }

    return this.prisma.legislation.findMany({
      where: {
        active: true,
        category: value as LegislationCategory,
      },

      orderBy: this.defaultOrder,
    });
  }

  // =====================================================
  // FILTRAR POR TIPO DE IMPOSTO
  // =====================================================

  async findByTaxType(taxType: string) {
    const value = String(taxType || '')
      .trim()
      .toUpperCase();

    const validTaxType =
      Object.values(TaxType).includes(
        value as TaxType,
      );

    if (!validTaxType) {
      return [];
    }

    return this.prisma.legislation.findMany({
      where: {
        active: true,
        taxType: value as TaxType,
      },

      orderBy: this.defaultOrder,
    });
  }

  // =====================================================
  // FILTRAR POR ASSUNTO
  // =====================================================

  async findBySubject(subject: string) {
    const value = String(subject || '').trim();

    if (!value) {
      return this.findAll();
    }

    return this.prisma.legislation.findMany({
      where: {
        active: true,

        subject: {
          contains: value,
          mode: 'insensitive',
        },
      },

      orderBy: this.defaultOrder,
    });
  }

  // =====================================================
  // PESQUISA AVANCADA
  //
  // Permite combinar:
  // - pesquisa
  // - categoria
  // - tipo de imposto
  // - assunto
  // =====================================================

  async advancedSearch(params: {
    search?: string;
    category?: string;
    taxType?: string;
    subject?: string;
  }) {
    const search = String(params.search || '').trim();

    const categoryValue = String(
      params.category || '',
    )
      .trim()
      .toUpperCase();

    const taxTypeValue = String(
      params.taxType || '',
    )
      .trim()
      .toUpperCase();

    const subjectValue = String(
      params.subject || '',
    ).trim();

    const where: any = {
      active: true,
    };

    // ---------------------------------------------------
    // CATEGORIA
    // ---------------------------------------------------

    if (categoryValue && categoryValue !== 'ALL') {
      const validCategory =
        Object.values(LegislationCategory).includes(
          categoryValue as LegislationCategory,
        );

      if (!validCategory) {
        return [];
      }

      where.category =
        categoryValue as LegislationCategory;
    }

    // ---------------------------------------------------
    // TIPO DE IMPOSTO
    // ---------------------------------------------------

    if (taxTypeValue && taxTypeValue !== 'ALL') {
      const validTaxType =
        Object.values(TaxType).includes(
          taxTypeValue as TaxType,
        );

      if (!validTaxType) {
        return [];
      }

      where.taxType = taxTypeValue as TaxType;
    }

    // ---------------------------------------------------
    // ASSUNTO
    // ---------------------------------------------------

    if (subjectValue) {
      where.subject = {
        contains: subjectValue,
        mode: 'insensitive',
      };
    }

    // ---------------------------------------------------
    // PESQUISA GERAL
    // ---------------------------------------------------

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },

        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },

        {
          content: {
            contains: search,
            mode: 'insensitive',
          },
        },

        {
          lawNumber: {
            contains: search,
            mode: 'insensitive',
          },
        },

        {
          article: {
            contains: search,
            mode: 'insensitive',
          },
        },

        {
          subject: {
            contains: search,
            mode: 'insensitive',
          },
        },

        {
          source: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    return this.prisma.legislation.findMany({
      where,

      orderBy: this.defaultOrder,
    });
  }
}