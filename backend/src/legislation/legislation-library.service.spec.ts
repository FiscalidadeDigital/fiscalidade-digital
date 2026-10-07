import { LegislationLibraryService } from './legislation-library.service';

describe('LegislationLibraryService extraction safeguards', () => {
  it('keeps supplied legal article text intact and does not fabricate articles', () => {
    const service = new LegislationLibraryService();
    const resolve = (service as any).resolveArticles.bind(service);

    expect(resolve({ articles: [{ article: 'Artigo 1.º', text: 'Texto legal preservado.' }] }))
      .toEqual([{ article: 'Artigo 1.º', text: 'Texto legal preservado.' }]);
    expect(resolve({ fullText: 'Documento sem marcador de artigo.' })).toEqual([]);
  });

  it('searches only the supplied document and article content', () => {
    const service = new LegislationLibraryService();
    const normalize = (service as any).normalizeForSearch.bind(service);

    expect(normalize('Imposto Industrial')).toBe('imposto industrial');
  });

  it('retrieves bounded verbatim legal chunks for RAG', () => {
    const service = new LegislationLibraryService();
    jest.spyOn(service as any, 'load').mockReturnValue({
      documents: [
        {
          sourceCategory: 'AGT',
          sourceFile: 'codigo-iva.pdf',
          titleDetected: 'Código do IVA',
          articles: [
            { article: 'ARTIGO 1.º', text: 'O IVA incide sobre as operações previstas neste Código.' },
            { article: 'ARTIGO 2.º', text: 'Texto sem correspondência.' },
          ],
        },
      ],
    });

    expect(service.retrieveForRag('Como funciona o IVA?', 1)).toEqual([
      {
        sourceCategory: 'AGT',
        sourceFile: 'codigo-iva.pdf',
        title: 'Código do IVA',
        article: 'ARTIGO 1.º',
        text: 'O IVA incide sobre as operações previstas neste Código.',
      },
    ]);
  });
});
