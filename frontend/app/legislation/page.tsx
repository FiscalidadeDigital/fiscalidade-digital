'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  Filter,
  Search,
  Scale,
  Ship,
  X,
} from 'lucide-react';

import {
  getLegislationLibrary,
  searchLegislationLibrary,
  type LibraryArticle,
  type LibraryDocument,
} from '@/services/legislation-library';

const DashboardLayout = dynamic(
  () => import('@/components/layout/DashboardLayout'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#f6f8fc]" />
    ),
  },
);

type SourceCategory = 'ALL' | 'AGT' | 'ADUANEIRA';

function normalizeText(value: string) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getCategoryLabel(category: string) {
  if (category === 'AGT') {
    return 'Legislação Fiscal — AGT';
  }

  if (category === 'ADUANEIRA') {
    return 'Legislação Aduaneira';
  }

  return category || 'Legislação';
}

function getCategoryIcon(category: string) {
  return category === 'ADUANEIRA' ? Ship : Scale;
}

function getDocumentTitle(document: LibraryDocument) {
  if (
    document.titleDetected &&
    document.titleDetected !== document.sourceFile
  ) {
    return document.titleDetected;
  }

  return String(document.sourceFile || 'Documento legal')
    .replace(/\.pdf$/i, '')
    .replace(/[_-]+/g, ' ');
}

function getDocumentDescription(document: LibraryDocument) {
  if (document.description) {
    return document.description;
  }

  if (document.lawNumber) {
    return `Diploma legal ${document.lawNumber}.`;
  }

  if (document.sourceCategory === 'ADUANEIRA') {
    return 'Documento integrante da legislação aduaneira de Angola.';
  }

  return 'Documento integrante da Biblioteca Fiscal Digital.';
}

function getArticleText(article: LibraryArticle) {
  return String(
    article.text ||
      article.content ||
      article.title ||
      'Conteúdo não disponível.',
  ).trim();
}

export default function LegislationPage() {
  const [mounted, setMounted] = useState(false);

  const [documents, setDocuments] = useState<
    LibraryDocument[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [search, setSearch] = useState('');

  const [sourceCategory, setSourceCategory] =
    useState<SourceCategory>('ALL');

  const [selected, setSelected] =
    useState<LibraryDocument | null>(null);

  const [selectedArticle, setSelectedArticle] =
    useState<LibraryArticle | null>(null);

  const [articleSearch, setArticleSearch] =
    useState('');

  const [showFullText, setShowFullText] =
    useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function loadLibrary() {
    try {
      setLoading(true);
      setError('');

      const result = await getLegislationLibrary();

      setDocuments(
        Array.isArray(result.documents)
          ? result.documents
          : [],
      );
    } catch (err) {
      console.error(
        'Erro ao carregar Biblioteca Fiscal:',
        err,
      );

      setError(
        'Não foi possível carregar a Biblioteca Fiscal.',
      );

      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }

  async function performSearch() {
    const query = search.trim();

    if (!query) {
      await loadLibrary();
      return;
    }

    try {
      setLoading(true);
      setError('');

      const result =
        await searchLegislationLibrary(query);

      setDocuments(
        Array.isArray(result) ? result : [],
      );
    } catch (err) {
      console.error(
        'Erro ao pesquisar legislação:',
        err,
      );

      setError(
        'Não foi possível realizar a pesquisa.',
      );

      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }

  /*
   * Abre directamente o documento já carregado pela API.
   *
   * Não chama /legislation/library/document/:sourceFile,
   * evitando o erro 404 apresentado anteriormente.
   */
  function openDocument(document: LibraryDocument) {
    setError('');
    setSelectedArticle(null);
    setArticleSearch('');
    setShowFullText(false);
    setSelected(document);
  }

  function closeDocument() {
    setSelected(null);
    setSelectedArticle(null);
    setArticleSearch('');
    setShowFullText(false);
  }

  function clearFilters() {
    setSearch('');
    setSourceCategory('ALL');
    void loadLibrary();
  }

  useEffect(() => {
    if (!mounted) {
      return;
    }

    void loadLibrary();
  }, [mounted]);

  const filteredDocuments = useMemo(() => {
    if (sourceCategory === 'ALL') {
      return documents;
    }

    return documents.filter(
      (document) =>
        document.sourceCategory === sourceCategory,
    );
  }, [documents, sourceCategory]);

  const filteredArticles = useMemo(() => {
    if (!selected?.articles) {
      return [];
    }

    const articles = Array.isArray(selected.articles)
      ? selected.articles
      : [];

    const query = normalizeText(articleSearch);

    if (!query) {
      return articles;
    }

    return articles.filter((article) => {
      const text = normalizeText(
        [
          article.article,
          article.title,
          article.text,
          article.content,
        ]
          .filter(Boolean)
          .join(' '),
      );

      return text.includes(query);
    });
  }, [selected, articleSearch]);

  const hasArticles =
    Boolean(selected) &&
    Array.isArray(selected?.articles) &&
    selected.articles.length > 0;

  const fullText = String(
    selected?.fullText || '',
  ).trim();

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f6f8fc]" />
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px]">

        {/* CABEÇALHO */}

        <section className="mb-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <div className="mb-3 flex items-center gap-2 text-[#5146e5]">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0edff]">
                  <BookOpen size={19} />
                </div>

                <span className="text-[12px] font-bold uppercase tracking-[0.08em]">
                  Biblioteca Fiscal
                </span>

              </div>

              <h1 className="text-[28px] font-bold tracking-[-0.03em] text-[#101b3d] sm:text-[32px]">
                Legislação Fiscal
              </h1>

              <p className="mt-2 max-w-[760px] text-[14px] leading-6 text-[#7180a2]">
                Consulte legislação fiscal e aduaneira
                de Angola, organizada por diplomas,
                artigos e conteúdo legal.
              </p>
            </div>

            <div className="rounded-xl border border-[#e5e8f0] bg-white px-5 py-3 shadow-sm">

              <div className="flex items-center gap-2">
                <Scale
                  size={17}
                  className="text-[#5146e5]"
                />

                <span className="text-[12px] font-semibold text-[#526080]">
                  Diplomas disponíveis
                </span>
              </div>

              <div className="mt-1 text-[23px] font-bold text-[#101b3d]">
                {filteredDocuments.length}
              </div>

            </div>

          </div>
        </section>

        {/* PESQUISA */}

        <section className="mb-7 rounded-2xl border border-[#e6e9f1] bg-white p-4 shadow-[0_2px_10px_rgba(20,30,60,0.03)]">

          <div className="flex flex-col gap-3 xl:flex-row">

            <div className="relative flex-1">

              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b96b0]"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void performSearch();
                  }
                }}
                placeholder="Pesquisar por diploma, lei, artigo ou conteúdo..."
                className="h-[44px] w-full rounded-lg border border-[#e1e5ee] bg-[#f9fafc] pl-11 pr-4 text-[13px] text-[#1b2748] outline-none transition placeholder:text-[#9aa4bb] focus:border-[#5146e5] focus:bg-white focus:ring-2 focus:ring-[#5146e5]/10"
              />

            </div>

            <div className="relative xl:w-[250px]">

              <Filter
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#8b96b0]"
              />

              <select
                value={sourceCategory}
                onChange={(event) =>
                  setSourceCategory(
                    event.target.value as SourceCategory,
                  )
                }
                className="h-[44px] w-full appearance-none rounded-lg border border-[#e1e5ee] bg-white pl-9 pr-8 text-[12px] font-medium text-[#263453] outline-none focus:border-[#5146e5] focus:ring-2 focus:ring-[#5146e5]/10"
              >
                <option value="ALL">
                  Toda a legislação
                </option>

                <option value="AGT">
                  Legislação Fiscal — AGT
                </option>

                <option value="ADUANEIRA">
                  Legislação Aduaneira
                </option>
              </select>

            </div>

            <button
              type="button"
              onClick={() => void performSearch()}
              disabled={loading}
              className="h-[44px] rounded-lg bg-[#5146e5] px-5 text-[12px] font-bold text-white transition hover:bg-[#4338ca] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'A carregar...' : 'Pesquisar'}
            </button>

            {(search || sourceCategory !== 'ALL') && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-[44px] items-center justify-center gap-2 rounded-lg border border-[#e1e5ee] bg-white px-4 text-[12px] font-semibold text-[#65728e] transition hover:border-[#5146e5] hover:text-[#5146e5]"
              >
                <X size={15} />
                Limpar
              </button>
            )}

          </div>

          <div className="mt-3 flex items-center justify-between">

            <p className="text-[11px] text-[#8a96ad]">
              Pesquise por nome do diploma, artigo
              ou conteúdo legal.
            </p>

            <button
              type="button"
              onClick={() => void loadLibrary()}
              className="text-[11px] font-bold text-[#5146e5] hover:underline"
            >
              Actualizar biblioteca
            </button>

          </div>

        </section>

        {/* ERRO */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-700">
            {error}
          </div>
        )}

        {/* LISTAGEM */}

        {loading ? (

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-[280px] animate-pulse rounded-2xl border border-[#e8ebf2] bg-white"
              />
            ))}

          </div>

        ) : filteredDocuments.length === 0 ? (

          <div className="rounded-2xl border border-[#e6e9f1] bg-white px-6 py-16 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0edff] text-[#5146e5]">
              <FileText size={25} />
            </div>

            <h3 className="mt-4 text-[16px] font-bold text-[#182442]">
              Nenhum diploma encontrado
            </h3>

            <p className="mx-auto mt-2 max-w-[480px] text-[12px] leading-5 text-[#8490aa]">
              Tente alterar a pesquisa ou seleccionar
              outra categoria.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-lg bg-[#5146e5] px-5 py-2.5 text-[11px] font-bold text-white"
            >
              Limpar filtros
            </button>

          </div>

        ) : (

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

            {filteredDocuments.map((document) => {
              const CategoryIcon = getCategoryIcon(
                document.sourceCategory,
              );

              return (
                <article
                  key={`${document.sourceCategory}-${document.sourceFile}`}
                  className="group flex min-h-[300px] flex-col rounded-2xl border border-[#e5e8f0] bg-white p-5 shadow-[0_2px_10px_rgba(20,30,60,0.025)] transition-all duration-200 hover:-translate-y-1 hover:border-[#d9d5ff] hover:shadow-[0_12px_30px_rgba(50,40,120,0.08)]"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="flex min-w-0 items-center gap-2">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f0edff] text-[#5146e5]">
                        <CategoryIcon size={17} />
                      </div>

                      <span className="truncate rounded-md bg-[#f5f6fa] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#526080]">
                        {getCategoryLabel(
                          document.sourceCategory,
                        )}
                      </span>

                    </div>

                    <span className="shrink-0 rounded-full bg-[#edf9f2] px-2.5 py-1 text-[9px] font-bold text-[#15945b]">
                      {document.articlesDetected || 0}{' '}
                      artigos
                    </span>

                  </div>

                  <h2 className="mt-5 line-clamp-4 text-[16px] font-bold leading-6 text-[#101b3d] transition group-hover:text-[#5146e5]">
                    {getDocumentTitle(document)}
                  </h2>

                  <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-[#8490aa]">
                    {getDocumentDescription(document)}
                  </p>

                  <div className="mt-4 space-y-2">

                    <div className="flex items-center gap-2 text-[10px] text-[#7180a2]">

                      <FileText
                        size={13}
                        className="shrink-0 text-[#8b96b0]"
                      />

                      <span className="truncate">
                        {document.sourceFile}
                      </span>

                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-[#7180a2]">

                      <BookOpen
                        size={13}
                        className="shrink-0 text-[#8b96b0]"
                      />

                      <span>
                        {document.pageCount || 0} páginas
                      </span>

                    </div>

                  </div>

                  <div className="flex-1" />

                  <button
                    type="button"
                    onClick={() => openDocument(document)}
                    className="mt-5 flex h-10 w-full items-center justify-between rounded-lg bg-[#f7f7ff] px-4 text-left text-[11px] font-bold text-[#5146e5] transition hover:bg-[#efedff]"
                  >
                    <span>Consultar diploma</span>
                    <ArrowRight size={15} />
                  </button>

                </article>
              );
            })}

          </div>

        )}

      </div>

      {/* MODAL */}

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#10152b]/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDocument();
            }
          }}
        >

          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* CABEÇALHO DO MODAL */}

            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#edf0f5] p-5">

              <div className="min-w-0">

                <div className="mb-2 flex flex-wrap items-center gap-2">

                  <span className="rounded-md bg-[#f0edff] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#5146e5]">
                    {getCategoryLabel(
                      selected.sourceCategory,
                    )}
                  </span>

                  <span className="rounded-full bg-[#edf9f2] px-2.5 py-1 text-[9px] font-bold text-[#15945b]">
                    {selected.articlesDetected || 0}{' '}
                    artigos detectados
                  </span>

                  {fullText.length > 0 && (
                    <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-[9px] font-bold text-[#4169c8]">
                      Texto disponível
                    </span>
                  )}

                </div>

                <h2 className="text-[20px] font-bold leading-7 text-[#101b3d]">
                  {getDocumentTitle(selected)}
                </h2>

                <p className="mt-1 text-[10px] text-[#8a96ad]">
                  {selected.sourceFile}
                  {' • '}
                  {selected.pageCount || 0} páginas
                </p>

              </div>

              <button
                type="button"
                onClick={closeDocument}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5f6fa] text-[#66728c] transition hover:bg-[#eceef5] hover:text-[#101b3d]"
                aria-label="Fechar documento"
              >
                <X size={17} />
              </button>

            </div>

            {/* CONTEÚDO DO MODAL */}

            <div className="min-h-0 flex-1 overflow-hidden">

              <div className="grid h-full grid-cols-1 lg:grid-cols-[320px_1fr]">

                {/* MENU LATERAL */}

                <aside className="border-b border-[#edf0f5] bg-[#fafbfe] lg:overflow-y-auto lg:border-b-0 lg:border-r">

                  <div className="border-b border-[#edf0f5] bg-[#fafbfe] p-4">

                    <div className="mb-3 flex items-center justify-between">

                      <div className="flex items-center gap-2">

                        <BookOpen
                          size={15}
                          className="text-[#5146e5]"
                        />

                        <span className="text-[11px] font-bold text-[#253453]">
                          Conteúdo
                        </span>

                      </div>

                      {hasArticles && (
                        <span className="text-[9px] font-semibold text-[#8a96ad]">
                          {filteredArticles.length}
                        </span>
                      )}

                    </div>

                    <div className="relative">

                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b96b0]"
                      />

                      <input
                        value={articleSearch}
                        onChange={(event) =>
                          setArticleSearch(
                            event.target.value,
                          )
                        }
                        placeholder={
                          hasArticles
                            ? 'Pesquisar artigo...'
                            : 'Pesquisar no documento...'
                        }
                        className="h-9 w-full rounded-lg border border-[#e1e5ee] bg-white pl-9 pr-3 text-[10px] text-[#263453] outline-none focus:border-[#5146e5]"
                      />

                    </div>

                  </div>

                  <div className="p-3">

                    {/* TEXTO INTEGRAL */}

                    {fullText.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedArticle(null);
                          setShowFullText(true);
                        }}
                        className={`mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${
                          showFullText
                            ? 'bg-[#5146e5] text-white'
                            : 'bg-white text-[#526080] hover:bg-[#f0edff] hover:text-[#5146e5]'
                        }`}
                      >

                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            showFullText
                              ? 'bg-white/15'
                              : 'bg-[#f0edff]'
                          }`}
                        >
                          <FileText size={14} />
                        </div>

                        <div className="min-w-0">

                          <div className="text-[10px] font-bold">
                            Texto integral
                          </div>

                          <div
                            className={`mt-0.5 text-[8px] ${
                              showFullText
                                ? 'text-white/70'
                                : 'text-[#8a96ad]'
                            }`}
                          >
                            Conteúdo completo do documento
                          </div>

                        </div>

                      </button>
                    )}

                    {/* ARTIGOS */}

                    {hasArticles ? (

                      filteredArticles.length === 0 ? (

                        <div className="px-3 py-8 text-center text-[10px] text-[#8a96ad]">
                          Nenhum artigo encontrado.
                        </div>

                      ) : (

                        <div className="space-y-1.5">

                          {filteredArticles.map(
                            (article, index) => {
                              const isSelected =
                                selectedArticle === article &&
                                !showFullText;

                              return (
                                <button
                                  type="button"
                                  key={`${article.article || 'article'}-${index}`}
                                  onClick={() => {
                                    setSelectedArticle(article);
                                    setShowFullText(false);
                                  }}
                                  className={`w-full rounded-lg px-3 py-2.5 text-left transition ${
                                    isSelected
                                      ? 'bg-[#5146e5] text-white'
                                      : 'bg-white text-[#526080] hover:bg-[#f0edff] hover:text-[#5146e5]'
                                  }`}
                                >

                                  <div className="text-[10px] font-bold">
                                    {article.article ||
                                      article.title ||
                                      `Artigo ${index + 1}`}
                                  </div>

                                  <div
                                    className={`mt-1 line-clamp-2 text-[9px] leading-4 ${
                                      isSelected
                                        ? 'text-white/75'
                                        : 'text-[#8a96ad]'
                                    }`}
                                  >
                                    {getArticleText(article)}
                                  </div>

                                </button>
                              );
                            },
                          )}

                        </div>

                      )

                    ) : (

                      <div className="rounded-xl border border-dashed border-[#dfe3ed] bg-white px-4 py-6 text-center">

                        <FileText
                          size={20}
                          className="mx-auto text-[#a0a9bd]"
                        />

                        <p className="mt-2 text-[10px] font-semibold text-[#526080]">
                          Artigos não detectados
                        </p>

                        <p className="mt-1 text-[9px] leading-4 text-[#8a96ad]">
                          Consulte as informações
                          disponíveis deste documento.
                        </p>

                      </div>

                    )}

                  </div>

                </aside>

                {/* ÁREA PRINCIPAL */}

                <main className="min-h-0 overflow-y-auto">

                  {showFullText ? (

                    <div className="p-6">

                      <button
                        type="button"
                        onClick={() => {
                          setShowFullText(false);
                          setSelectedArticle(null);
                        }}
                        className="mb-5 inline-flex items-center gap-2 text-[10px] font-bold text-[#5146e5] hover:underline"
                      >
                        <ArrowLeft size={13} />
                        Voltar
                      </button>

                      <div className="mb-6 rounded-xl border border-[#e5e8f0] bg-[#fafbfe] p-5">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0edff] text-[#5146e5]">
                            <FileText size={18} />
                          </div>

                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wide text-[#8a96ad]">
                              Documento legal
                            </p>

                            <h3 className="text-[15px] font-bold text-[#101b3d]">
                              Texto integral
                            </h3>
                          </div>

                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">

                          <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-semibold text-[#65728e]">
                            {selected.pageCount || 0} páginas
                          </span>

                          <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-semibold text-[#65728e]">
                            {fullText.length.toLocaleString(
                              'pt-PT',
                            )}{' '}
                            caracteres
                          </span>

                        </div>

                      </div>

                      <div className="whitespace-pre-wrap break-words text-[12px] leading-7 text-[#394866]">
                        {fullText}
                      </div>

                    </div>

                  ) : selectedArticle ? (

                    <div className="p-6">

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedArticle(null)
                        }
                        className="mb-5 inline-flex items-center gap-2 text-[10px] font-bold text-[#5146e5] hover:underline"
                      >
                        <ArrowLeft size={13} />
                        Voltar aos artigos
                      </button>

                      <div className="mb-5 rounded-xl border border-[#e5e8f0] bg-[#fafbfe] p-5">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0edff] text-[#5146e5]">
                            <Scale size={18} />
                          </div>

                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wide text-[#8a96ad]">
                              Norma jurídica
                            </p>

                            <h3 className="text-[16px] font-bold text-[#101b3d]">
                              {selectedArticle.article ||
                                selectedArticle.title ||
                                'Artigo'}
                            </h3>
                          </div>

                        </div>

                      </div>

                      <div className="whitespace-pre-wrap break-words text-[12px] leading-7 text-[#394866]">
                        {getArticleText(selectedArticle)}
                      </div>

                    </div>

                  ) : (

                    <div className="flex min-h-full flex-col items-center justify-center px-6 py-20 text-center">

                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0edff] text-[#5146e5]">
                        <BookOpen size={28} />
                      </div>

                      <h3 className="mt-5 text-[17px] font-bold text-[#182442]">
                        Consulte o diploma
                      </h3>

                      <p className="mt-2 max-w-[430px] text-[11px] leading-5 text-[#8490aa]">
                        Seleccione um artigo ou abra o
                        texto integral para consultar
                        o conteúdo jurídico.
                      </p>

                      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

                        <div className="rounded-xl border border-[#e8ebf2] bg-[#fafbfe] px-5 py-4">
                          <p className="text-[9px] uppercase tracking-wide text-[#8a96ad]">
                            Artigos
                          </p>

                          <p className="mt-1 text-[18px] font-bold text-[#253453]">
                            {selected.articlesDetected || 0}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#e8ebf2] bg-[#fafbfe] px-5 py-4">
                          <p className="text-[9px] uppercase tracking-wide text-[#8a96ad]">
                            Páginas
                          </p>

                          <p className="mt-1 text-[18px] font-bold text-[#253453]">
                            {selected.pageCount || 0}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#e8ebf2] bg-[#fafbfe] px-5 py-4">
                          <p className="text-[9px] uppercase tracking-wide text-[#8a96ad]">
                            Texto
                          </p>

                          <p className="mt-1 text-[18px] font-bold text-[#253453]">
                            {fullText.length > 0 ? 'OK' : '—'}
                          </p>
                        </div>

                      </div>

                      {fullText.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowFullText(true)}
                          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#5146e5] px-5 py-2.5 text-[11px] font-bold text-white transition hover:bg-[#4338ca]"
                        >
                          <FileText size={14} />
                          Abrir texto integral
                        </button>
                      )}

                    </div>

                  )}

                </main>

              </div>

            </div>

            {/* RODAPÉ */}

            <div className="flex shrink-0 items-center justify-between border-t border-[#edf0f5] p-4">

              <div className="text-[10px] text-[#8a96ad]">
                Biblioteca Fiscal Digital
              </div>

              <button
                type="button"
                onClick={closeDocument}
                className="rounded-lg bg-[#101b3d] px-5 py-2.5 text-[11px] font-bold text-white transition hover:bg-[#172653]"
              >
                Fechar
              </button>

            </div>

          </div>

        </div>
      )}

    </DashboardLayout>
  );
}