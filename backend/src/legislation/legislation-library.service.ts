import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface LibraryArticle {
  article: string;
  text: string;
}

export interface LibraryDocument {
  sourceCategory: string;
  sourceFile: string;
  titleDetected?: string;
  pageCount?: number;
  articlesDetected?: number;
  articles?: LibraryArticle[];
  fullText?: string;
  [key: string]: unknown;
}

export interface RagLibraryChunk {
  sourceCategory: string;
  sourceFile: string;
  title: string;
  article: string | null;
  text: string;
}

@Injectable()
export class LegislationLibraryService {
  private normalizeText(value: unknown): string {
    return String(value ?? '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private normalizeForSearch(value: unknown): string {
    return this.normalizeText(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private extractArticlesFromFullText(fullText: string): LibraryArticle[] {
    const text = this.normalizeText(fullText);
    if (!text) return [];

    const regex =
      /(?:^|\n)\s*(?:ARTIGO|Artigo)\s+(\d{1,4})\s*[.º°ª]*(?:\s*[-–—:]?)?\s*/g;
    const matches: Array<{ index: number; end: number; number: string }> = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      matches.push({ index: match.index, end: regex.lastIndex, number: match[1] });
    }

    return matches.reduce<LibraryArticle[]>((articles, current, index) => {
      const next = matches[index + 1];
      const articleText = this.normalizeText(
        text.slice(current.end, next ? next.index : text.length),
      );
      if (articleText) {
        articles.push({ article: `ARTIGO ${current.number}.º`, text: articleText });
      }
      return articles;
    }, []);
  }

  private resolveArticles(document: LibraryDocument): LibraryArticle[] {
    const suppliedArticles = Array.isArray(document.articles)
      ? document.articles
      .map((article) => ({
        article: this.normalizeText(article?.article),
        text: this.normalizeText(article?.text),
      }))
      .filter((article) => article.article.length > 0 && article.text.length > 0)
      : [];

    return suppliedArticles.length > 0
      ? suppliedArticles
      : this.extractArticlesFromFullText(this.normalizeText(document.fullText));
  }

  private resolveTitle(document: LibraryDocument): string {
    const detected = this.normalizeText(document.titleDetected);
    const fileName = this.normalizeText(document.sourceFile);
    if (
      detected &&
      detected !== fileName &&
      detected.length <= 180 &&
      detected.split(/\s+/).length <= 28 &&
      !/^ARTIGO\s+\d+/i.test(detected)
    ) {
      return detected;
    }

    const titleLine = this.normalizeText(document.fullText)
      .split('\n')
      .map((line) => this.normalizeText(line))
      .slice(0, 100)
      .find(
        (line) =>
          line.length >= 8 &&
          line.length <= 180 &&
          (/^(LEI|DECRETO|DECRETO PRESIDENCIAL|DECRETO LEGISLATIVO|DESPACHO|REGULAMENTO|CÓDIGO|CODIGO|PORTARIA|AVISO|INSTRUTIVO|INSTRUÇÃO|INSTRUCAO|REGIME|MANUAL)\b/i.test(
            line,
          ) ||
            (/(CÓDIGO|CODIGO|IMPOSTO|TRIBUTÁRIO|TRIBUTARIO|FISCAL|ADUANEIRO|ADUANEIRA)/i.test(
              line,
            ) &&
              line.split(/\s+/).length <= 22)),
      );

    return titleLine ||
      fileName.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();
  }

  private prepareDocument(
    document: LibraryDocument,
    includeFullText = false,
  ): LibraryDocument {
    const prepared: LibraryDocument = {
      ...document,
      titleDetected: this.resolveTitle(document),
      articles: this.resolveArticles(document),
      articlesDetected: this.resolveArticles(document).length,
    };

    if (!includeFullText) delete prepared.fullText;
    return prepared;
  }

  /**
   * Localiza a biblioteca fiscal independentemente de o Nest
   * estar a executar em desenvolvimento ou na pasta dist.
   */
  private getFilePath(): string {
    const possiblePaths = [
      // Execução normal a partir da raiz do backend
      path.resolve(
        process.cwd(),
        '..',
        'storage',
        'legislation-fiscal',
        'legislacao-fiscal-digital-estrutura.json',
      ),

      // Execução a partir da raiz do projeto
      path.resolve(
        process.cwd(),
        'storage',
        'legislation-fiscal',
        'legislacao-fiscal-digital-estrutura.json',
      ),

      // Caminho relativo ao ficheiro compilado / desenvolvimento
      path.resolve(
        __dirname,
        '../../../storage/legislation-fiscal/legislacao-fiscal-digital-estrutura.json',
      ),

      // Alternativa para estruturas diferentes de dist
      path.resolve(
        __dirname,
        '../../../../storage/legislation-fiscal/legislacao-fiscal-digital-estrutura.json',
      ),
    ];

    const existingPath = possiblePaths.find((filePath) =>
      fs.existsSync(filePath),
    );

    if (!existingPath) {
      throw new NotFoundException(
        'Biblioteca de legislação não encontrada.',
      );
    }

    return existingPath;
  }

  /**
   * Carrega o JSON completo da biblioteca.
   */
  private load(): any {
    const filePath = this.getFilePath();

    try {
      const raw = fs.readFileSync(filePath, 'utf8');

      return JSON.parse(raw);
    } catch (error) {
      throw new NotFoundException(
        'Não foi possível carregar a biblioteca de legislação.',
      );
    }
  }

  // =====================================================
  // BIBLIOTECA COMPLETA
  // =====================================================

  getLibrary() {
    const data = this.load();
    const documents: LibraryDocument[] = Array.isArray(data.documents)
      ? data.documents
      : [];

    return {
      version: data.version ?? '1.0',
      name: data.name ?? 'Legislação Fiscal e Aduaneira de Angola',
      sourceDocuments: documents.length,
      documents: documents.map((document) =>
        this.prepareDocument(document, false),
      ),
    };
  }

  // =====================================================
  // LISTAR DOCUMENTOS
  // =====================================================

  getDocuments() {
    const data = this.load();
    const documents: LibraryDocument[] = Array.isArray(data.documents)
      ? data.documents
      : [];
    return documents.map((document) => {
      const prepared = this.prepareDocument(document, false);
      return {
        sourceCategory: prepared.sourceCategory,
        sourceFile: prepared.sourceFile,
        titleDetected: prepared.titleDetected,
        pageCount: prepared.pageCount ?? 0,
        articlesDetected: prepared.articlesDetected ?? 0,
      };
    });
  }

  // =====================================================
  // BUSCAR UM DIPLOMA
  // =====================================================

  getDocument(sourceFile: string) {
    const data = this.load();

    const documents: LibraryDocument[] = Array.isArray(data.documents)
      ? data.documents
      : [];
    const document = documents.find(
      (doc) => doc.sourceFile === sourceFile,
    );

    if (!document) {
      throw new NotFoundException(
        'Diploma não encontrado.',
      );
    }

    return this.prepareDocument(document, true);
  }

  // =====================================================
  // PESQUISAR NA BIBLIOTECA
  // =====================================================

  search(query: string) {
    const data = this.load();

    const documents: LibraryDocument[] = Array.isArray(data.documents)
      ? data.documents
      : [];
    const q = this.normalizeForSearch(query);

    // Sem pesquisa: devolver todos os documentos
    if (!q) {
      return documents.map((document) => this.prepareDocument(document, false));
    }

    return documents
      .map((document) => {
        const prepared = this.prepareDocument(document, false);
        const articles = prepared.articles ?? [];
        const matchingArticles = articles.filter((article) =>
          this.normalizeForSearch(`${article.article} ${article.text}`).includes(q),
        );
        const documentMatch = this.normalizeForSearch(
          `${prepared.titleDetected} ${prepared.sourceFile}`,
        ).includes(q);

        if (!documentMatch && matchingArticles.length === 0) {
          return null;
        }

        return {
          ...prepared,
          articles: matchingArticles.length > 0 ? matchingArticles : articles,
        };
      })
      .filter(Boolean);
  }

  /**
   * Devolve excertos jurídicos curtos e verificáveis para o contexto RAG.
   * Não altera documentos, não cria artigos e limita a resposta ao material
   * efectivamente carregado da biblioteca.
   */
  retrieveForRag(query: string, limit = 8): RagLibraryChunk[] {
    const normalizedQuery = this.normalizeForSearch(query);
    const terms = Array.from(
      new Set(
        normalizedQuery
          .match(/[a-z0-9-]{3,}/g)
          ?.filter(
            (term) =>
              ![
                'como',
                'para',
                'qual',
                'quais',
                'sobre',
                'tenho',
                'uma',
                'meu',
                'minha',
                'devo',
                'sao',
                'das',
                'dos',
              ].includes(term),
          ) ?? [],
      ),
    ).slice(0, 8);

    if (!terms.length) {
      return [];
    }

    const data = this.load();
    const documents: LibraryDocument[] = Array.isArray(data.documents)
      ? data.documents
      : [];
    const chunks: Array<RagLibraryChunk & { score: number }> = [];

    for (const document of documents) {
      const sourceCategory = this.normalizeText(document.sourceCategory);
      const sourceFile = this.normalizeText(document.sourceFile);
      const title =
        this.normalizeText(document.titleDetected) || sourceFile || 'Documento';
      const documentText = this.normalizeForSearch(
        `${sourceCategory} ${sourceFile} ${title}`,
      );
      const documentScore = terms.reduce(
        (score, term) => score + (documentText.includes(term) ? 3 : 0),
        0,
      );
      const articles = this.resolveArticles(document);

      for (const article of articles) {
        const articleText = this.normalizeForSearch(
          `${article.article} ${article.text}`,
        );
        const articleScore = terms.reduce(
          (score, term) => score + (articleText.includes(term) ? 1 : 0),
          0,
        );
        const score = documentScore + articleScore;

        if (score > 0) {
          chunks.push({
            sourceCategory,
            sourceFile,
            title,
            article: article.article,
            text: article.text,
            score,
          });
        }
      }

      const fullText = this.normalizeText(document.fullText);
      if (!articles.length && documentScore > 0 && fullText) {
        chunks.push({
          sourceCategory,
          sourceFile,
          title,
          article: null,
          text: fullText,
          score: documentScore,
        });
      }
    }

    const boundedLimit = Math.max(1, Math.min(Math.trunc(limit) || 8, 12));
    return chunks
      .sort((left, right) => right.score - left.score)
      .slice(0, boundedLimit)
      .map(({ score: _score, ...chunk }) => chunk);
  }
}
