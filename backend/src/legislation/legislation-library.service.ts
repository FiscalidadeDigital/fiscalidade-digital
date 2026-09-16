import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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
  [key: string]: any;
}

@Injectable()
export class LegislationLibraryService {

  // ============================================================
  // LOCALIZAR BIBLIOTECA
  // ============================================================

  private findLibraryFile(): string | null {

    const fileName =
      'legislacao-fiscal-digital-estrutura.json';

    const candidates = [
      // Backend executado a partir de src
      path.resolve(
        __dirname,
        '../../../storage/legislation-fiscal',
        fileName,
      ),

      // Backend compilado para dist
      path.resolve(
        __dirname,
        '../../../storage/legislation-fiscal',
        fileName,
      ),

      // Executando npm a partir da pasta backend
      path.resolve(
        process.cwd(),
        '../storage/legislation-fiscal',
        fileName,
      ),

      // Caso a storage esteja dentro do backend
      path.resolve(
        process.cwd(),
        'storage/legislation-fiscal',
        fileName,
      ),

      // Raiz conhecida do projecto
      path.resolve(
        'C:/Users/rokhan/fiscalidade-digital/storage/legislation-fiscal',
        fileName,
      ),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  // ============================================================
  // CARREGAR BIBLIOTECA
  // ============================================================

  private load(): any {

    const filePath =
      this.findLibraryFile();

    if (!filePath) {

      throw new NotFoundException(
        'Biblioteca de legislação não encontrada.',
      );
    }

    try {

      const raw =
        fs.readFileSync(
          filePath,
          'utf8',
        );

      return JSON.parse(raw);

    } catch (error) {

      throw new NotFoundException(
        'Não foi possível ler a biblioteca de legislação.',
      );
    }
  }

  // ============================================================
  // NORMALIZAR TEXTO
  // ============================================================

  private normalizeText(
    value: unknown,
  ): string {

    return String(value ?? '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  // ============================================================
  // NORMALIZAR PESQUISA
  // ============================================================

  private normalizeForSearch(
    value: unknown,
  ): string {

    return this.normalizeText(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      );
  }

  // ============================================================
  // EXTRAIR ARTIGOS
  // ============================================================

  private extractArticlesFromFullText(
    fullText: string,
  ): LibraryArticle[] {

    const text =
      this.normalizeText(fullText);

    if (!text) {
      return [];
    }

    const regex =
      /(?:^|\n)\s*(?:ARTIGO|Artigo)\s+(\d{1,4})(?:\s*[º°ª.]?)?(?:\s*[-–—:]?)?\s*/g;

    const matches: Array<{
      index: number;
      end: number;
      number: string;
    }> = [];

    let match: RegExpExecArray | null;

    while (
      (match = regex.exec(text)) !== null
    ) {

      matches.push({
        index: match.index,
        end: regex.lastIndex,
        number: match[1],
      });
    }

    if (matches.length === 0) {
      return [];
    }

    const articles: LibraryArticle[] = [];

    for (
      let index = 0;
      index < matches.length;
      index++
    ) {

      const current =
        matches[index];

      const next =
        matches[index + 1];

      const start =
        current.end;

      const end =
        next
          ? next.index
          : text.length;

      const articleText =
        this.normalizeText(
          text.slice(
            start,
            end,
          ),
        );

      if (!articleText) {
        continue;
      }

      articles.push({
        article:
          `ARTIGO ${current.number}.º`,

        text:
          articleText,
      });
    }

    return articles;
  }

  // ============================================================
  // RESOLVER ARTIGOS
  // ============================================================

  private resolveArticles(
    document: LibraryDocument,
  ): LibraryArticle[] {

    const original =
      Array.isArray(document.articles)
        ? document.articles
        : [];

    const validOriginal =
      original
        .filter(
          (article) =>
            article &&
            String(
              article.article ?? '',
            ).trim() &&
            String(
              article.text ?? '',
            ).trim(),
        )
        .map(
          (article) => ({
            article:
              this.normalizeText(
                article.article,
              ),

            text:
              this.normalizeText(
                article.text,
              ),
          }),
        );

    if (
      validOriginal.length > 0
    ) {
      return validOriginal;
    }

    if (
      document.fullText
    ) {
      return this.extractArticlesFromFullText(
        document.fullText,
      );
    }

    return [];
  }

  // ============================================================
  // RESOLVER TÍTULO
  // ============================================================

  private resolveTitle(
    document: LibraryDocument,
  ): string {

    const detected =
      this.normalizeText(
        document.titleDetected,
      );

    const fileName =
      this.normalizeText(
        document.sourceFile,
      );

    if (
      detected &&
      detected !== fileName &&
      detected.length <= 180
    ) {

      const words =
        detected.split(/\s+/);

      if (
        words.length <= 28 &&
        !/^ARTIGO\s+\d+/i.test(
          detected,
        )
      ) {
        return detected;
      }
    }

    const fullText =
      this.normalizeText(
        document.fullText,
      );

    if (fullText) {

      const lines =
        fullText
          .split('\n')
          .map(
            (line) =>
              this.normalizeText(line),
          )
          .filter(Boolean)
          .slice(0, 100);

      for (const line of lines) {

        if (
          line.length < 8 ||
          line.length > 180
        ) {
          continue;
        }

        if (
          /^(LEI|DECRETO|DECRETO PRESIDENCIAL|DECRETO LEGISLATIVO|DESPACHO|REGULAMENTO|CÓDIGO|CODIGO|PORTARIA|AVISO|INSTRUTIVO|INSTRUÇÃO|INSTRUCAO|REGIME|MANUAL)\b/i.test(
            line,
          )
        ) {
          return line;
        }

        if (
          /(CÓDIGO|CODIGO|IMPOSTO|TRIBUTÁRIO|TRIBUTARIO|FISCAL|ADUANEIRO|ADUANEIRA)/i.test(
            line,
          ) &&
          line.split(/\s+/).length <= 22
        ) {
          return line;
        }
      }
    }

    return fileName
      .replace(
        /\.pdf$/i,
        '',
      )
      .replace(
        /[_-]+/g,
        ' ',
      )
      .trim();
  }

  // ============================================================
  // PREPARAR DOCUMENTO
  // ============================================================

  private prepareDocument(
    document: LibraryDocument,
    includeFullText = false,
  ): LibraryDocument {

    const articles =
      this.resolveArticles(
        document,
      );

    const prepared: LibraryDocument =
      {
        ...document,

        titleDetected:
          this.resolveTitle(
            document,
          ),

        articlesDetected:
          articles.length,

        articles,
      };

    if (!includeFullText) {
      delete prepared.fullText;
    }

    return prepared;
  }

  // ============================================================
  // BIBLIOTECA COMPLETA
  // ============================================================

  getLibrary() {

    const data =
      this.load();

    const documents:
      LibraryDocument[] =
      Array.isArray(
        data.documents,
      )
        ? data.documents
        : [];

    return {
      version:
        data.version ?? '1.0',

      name:
        data.name ??
        'Legislação Fiscal e Aduaneira de Angola',

      sourceDocuments:
        documents.length,

      documents:
        documents.map(
          (document) =>
            this.prepareDocument(
              document,
              false,
            ),
        ),
    };
  }

  // ============================================================
  // LISTAR DOCUMENTOS
  // ============================================================

  getDocuments() {

    const data =
      this.load();

    const documents:
      LibraryDocument[] =
      Array.isArray(
        data.documents,
      )
        ? data.documents
        : [];

    return documents.map(
      (document) => {

        const prepared =
          this.prepareDocument(
            document,
            false,
          );

        return {

          sourceCategory:
            prepared.sourceCategory,

          sourceFile:
            prepared.sourceFile,

          titleDetected:
            prepared.titleDetected,

          pageCount:
            prepared.pageCount ?? 0,

          articlesDetected:
            prepared.articlesDetected ?? 0,
        };
      },
    );
  }

  // ============================================================
  // DOCUMENTO INDIVIDUAL
  // ============================================================

  getDocument(
    sourceFile: string,
  ) {

    const data =
      this.load();

    const documents:
      LibraryDocument[] =
      Array.isArray(
        data.documents,
      )
        ? data.documents
        : [];

    const document =
      documents.find(
        (item) =>
          item.sourceFile ===
          sourceFile,
      );

    if (!document) {

      throw new NotFoundException(
        'Diploma não encontrado.',
      );
    }

    return this.prepareDocument(
      document,
      true,
    );
  }

  // ============================================================
  // PESQUISA
  // ============================================================

  search(
    query: string,
  ) {

    const data =
      this.load();

    const documents:
      LibraryDocument[] =
      Array.isArray(
        data.documents,
      )
        ? data.documents
        : [];

    const q =
      this.normalizeForSearch(
        query,
      );

    if (!q) {

      return documents.map(
        (document) =>
          this.prepareDocument(
            document,
            false,
          ),
      );
    }

    const results =
      documents.map(
        (document) => {

          const prepared =
            this.prepareDocument(
              document,
              false,
            );

          const title =
            this.normalizeForSearch(
              prepared.titleDetected,
            );

          const file =
            this.normalizeForSearch(
              prepared.sourceFile,
            );

          const articles =
            Array.isArray(
              prepared.articles,
            )
              ? prepared.articles
              : [];

          const matchingArticles =
            articles.filter(
              (article) => {

                const searchable =
                  this.normalizeForSearch(
                    `${article.article} ${article.text}`,
                  );

                return searchable.includes(
                  q,
                );
              },
            );

          const documentMatch =
            `${title} ${file}`.includes(
              q,
            );

          if (
            !documentMatch &&
            matchingArticles.length === 0
          ) {
            return null;
          }

          return {
            ...prepared,

            articles:
              matchingArticles.length > 0
                ? matchingArticles
                : articles,
          };
        },
      );

    return results.filter(
      (document) =>
        document !== null,
    );
  }
}
