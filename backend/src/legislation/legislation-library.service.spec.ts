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
});
