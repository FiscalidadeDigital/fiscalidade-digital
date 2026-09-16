'use client';

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  AlertCircle,
  Archive,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  File,
  FileText,
  Filter,
  FolderOpen,
  Loader2,
  MoreVertical,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import {
  deleteDocument,
  DocumentCategory,
  DocumentSummary,
  FiscalDocument,
  formatDocumentSize,
  getDocumentSummary,
  getDocuments,
  getDocumentUrl,
  uploadDocument,
} from '../../services/document';

const categories: {
  value: DocumentCategory;
  label: string;
}[] = [
  {
    value: 'FACTURA',
    label: 'Facturas',
  },
  {
    value: 'RECIBO',
    label: 'Recibos',
  },
  {
    value: 'DECLARACAO',
    label: 'Declarações',
  },
  {
    value: 'PAGAMENTO',
    label: 'Pagamentos',
  },
  {
    value: 'CONTRATO',
    label: 'Contratos',
  },
  {
    value: 'EMPRESA',
    label: 'Empresa',
  },
  {
    value: 'COMPROVATIVO',
    label: 'Comprovativos',
  },
  {
    value: 'RELATORIO',
    label: 'Relatórios',
  },
  {
    value: 'OUTROS',
    label: 'Outros',
  },
];

function getCategoryLabel(
  category: DocumentCategory,
) {
  const item = categories.find(
    (item) => item.value === category,
  );

  return item?.label || 'Outros';
}

function getCategoryIcon(
  category: DocumentCategory,
) {
  switch (category) {
    case 'FACTURA':
      return FileText;

    case 'RECIBO':
      return FileText;

    case 'DECLARACAO':
      return FileText;

    case 'PAGAMENTO':
      return FileText;

    case 'CONTRATO':
      return FileText;

    case 'EMPRESA':
      return FolderOpen;

    case 'COMPROVATIVO':
      return FileText;

    case 'RELATORIO':
      return FileText;

    default:
      return File;
  }
}

function getFileIcon(
  mimeType: string,
) {
  if (
    mimeType === 'application/pdf'
  ) {
    return FileText;
  }

  if (
    mimeType.startsWith('image/')
  ) {
    return File;
  }

  return File;
}

function formatDate(
  value: string,
) {
  try {
    return new Intl.DateTimeFormat(
      'pt-PT',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    ).format(new Date(value));
  } catch {
    return '-';
  }
}

function getExtension(
  name: string,
) {
  const parts = name.split('.');

  if (parts.length < 2) {
    return 'FILE';
  }

  return (
    parts[parts.length - 1] ||
    'FILE'
  ).toUpperCase();
}

export default function DocumentsPage() {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [documents, setDocuments] =
    useState<FiscalDocument[]>([]);

  const [summary, setSummary] =
    useState<DocumentSummary | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [dragging, setDragging] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const [category, setCategory] =
    useState<
      DocumentCategory | 'ALL'
    >('ALL');

  const [
    showUpload,
    setShowUpload,
  ] = useState(false);

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(null);

  const [
    documentName,
    setDocumentName,
  ] = useState('');

  const [
    documentDescription,
    setDocumentDescription,
  ] = useState('');

  const [
    documentCategory,
    setDocumentCategory,
  ] =
    useState<DocumentCategory>(
      'OUTROS',
    );

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(null);

  const [
    openMenu,
    setOpenMenu,
  ] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        documentData,
        summaryData,
      ] = await Promise.all([
        getDocuments({
          search:
            search.trim() ||
            undefined,

          category:
            category === 'ALL'
              ? undefined
              : category,
        }),

        getDocumentSummary(),
      ]);

      setDocuments(
        documentData,
      );

      setSummary(
        summaryData,
      );
    } catch (err: any) {
      console.error(
        'Erro ao carregar documentos:',
        err,
      );

      setError(
        err?.response?.data
          ?.message ||
          'Não foi possível carregar os documentos.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        loadData();
      }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    search,
    category,
  ]);

  const resetUpload = () => {
    setSelectedFile(null);
    setDocumentName('');
    setDocumentDescription('');
    setDocumentCategory('OUTROS');

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const closeUpload = () => {
    if (uploading) {
      return;
    }

    setShowUpload(false);
    resetUpload();
  };

  const validateFile = (
    file: File,
  ) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    const maxSize =
      10 * 1024 * 1024;

    if (
      !allowedTypes.includes(
        file.type,
      )
    ) {
      setError(
        'Formato não permitido. Utilize PDF, JPG, PNG ou WEBP.',
      );

      return false;
    }

    if (file.size > maxSize) {
      setError(
        'O ficheiro não pode ultrapassar 10 MB.',
      );

      return false;
    }

    return true;
  };

  const selectFile = (
    file?: File,
  ) => {
    if (!file) {
      return;
    }

    setError('');

    if (!validateFile(file)) {
      return;
    }

    setSelectedFile(file);

    if (!documentName) {
      setDocumentName(
        file.name.replace(
          /\.[^/.]+$/,
          '',
        ),
      );
    }
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    selectFile(file);
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();

    setDragging(false);

    const file =
      event.dataTransfer.files?.[0];

    selectFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError(
        'Selecione um ficheiro primeiro.',
      );

      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      await uploadDocument({
        file: selectedFile,

        name:
          documentName.trim() ||
          selectedFile.name,

        description:
          documentDescription.trim() ||
          undefined,

        category:
          documentCategory,
      });

      setSuccess(
        'Documento enviado com sucesso.',
      );

      setShowUpload(false);

      resetUpload();

      await loadData();

      window.setTimeout(() => {
        setSuccess('');
      }, 3500);
    } catch (err: any) {
      console.error(
        'Erro no upload:',
        err,
      );

      setError(
        err?.response?.data
          ?.message ||
          'Não foi possível enviar o documento.',
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (
    document: FiscalDocument,
  ) => {
    const confirmed =
      window.confirm(
        `Tem a certeza que deseja eliminar "${document.name}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        document.id,
      );

      setError('');

      await deleteDocument(
        document.id,
      );

      setDocuments(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              document.id,
          ),
      );

      const summaryData =
        await getDocumentSummary();

      setSummary(
        summaryData,
      );

      setSuccess(
        'Documento eliminado com sucesso.',
      );

      setOpenMenu(null);

      window.setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error(
        'Erro ao eliminar:',
        err,
      );

      setError(
        err?.response?.data
          ?.message ||
          'Não foi possível eliminar o documento.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocuments =
    useMemo(
      () => documents,
      [documents],
    );

  const totalSize =
    summary?.totalSize || 0;

  return (
    <div className="documents-page">
      <div className="page-background" />

      <main className="documents-container">
        {/* HEADER */}
        <section className="hero">
          <div>
            <div className="eyebrow">
              <Archive size={15} />
              Gestão documental
            </div>

            <h1>
              Os seus documentos,
              <span>
                organizados.
              </span>
            </h1>

            <p>
              Centralize facturas,
              declarações,
              comprovativos e
              documentos da sua
              empresa num único
              espaço.
            </p>
          </div>

          <button
            type="button"
            className="upload-button"
            onClick={() => {
              setError('');
              setShowUpload(true);
            }}
          >
            <Upload size={19} />
            Carregar documento
          </button>
        </section>

        {/* ALERTA DE ERRO */}
        {error && (
          <div className="alert error-alert">
            <AlertCircle size={19} />

            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* ALERTA DE SUCESSO */}
        {success && (
          <div className="alert success-alert">
            <CheckCircle2
              size={19}
            />

            <span>{success}</span>

            <button
              type="button"
              onClick={() =>
                setSuccess('')
              }
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* ESTATÍSTICAS */}
        <section className="stats-grid">
          <div className="stat-card featured">
            <div className="stat-icon">
              <FolderOpen size={22} />
            </div>

            <div>
              <span>
                Total de documentos
              </span>

              <strong>
                {summary?.total ??
                  0}
              </strong>

              <small>
                Arquivos armazenados
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">
              <FileText size={22} />
            </div>

            <div>
              <span>
                Facturas
              </span>

              <strong>
                {summary
                  ?.categories
                  .FACTURA ??
                  0}
              </strong>

              <small>
                Documentos fiscais
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <CheckCircle2
                size={22}
              />
            </div>

            <div>
              <span>
                Comprovativos
              </span>

              <strong>
                {summary
                  ?.categories
                  .COMPROVATIVO ??
                  0}
              </strong>

              <small>
                Documentos de suporte
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <Archive size={22} />
            </div>

            <div>
              <span>
                Espaço utilizado
              </span>

              <strong>
                {formatDocumentSize(
                  totalSize,
                )}
              </strong>

              <small>
                Armazenamento local
              </small>
            </div>
          </div>
        </section>

        {/* LISTA */}
        <section className="documents-card">
          <div className="toolbar">
            <div className="search-box">
              <Search size={19} />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Pesquisar documentos..."
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch('')
                  }
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <div className="filter-box">
              <Filter size={17} />

              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target
                      .value as
                      | DocumentCategory
                      | 'ALL',
                  )
                }
              >
                <option value="ALL">
                  Todas as categorias
                </option>

                {categories.map(
                  (item) => (
                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {item.label}
                    </option>
                  ),
                )}
              </select>

              <ChevronDown
                size={16}
              />
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <Loader2
                size={32}
                className="spin"
              />

              <h3>
                A carregar documentos...
              </h3>

              <p>
                Estamos a consultar
                os seus documentos.
              </p>
            </div>
          ) : filteredDocuments.length ===
            0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <FolderOpen
                  size={32}
                />
              </div>

              <h3>
                {search ||
                category !== 'ALL'
                  ? 'Nenhum documento encontrado'
                  : 'Ainda não existem documentos'}
              </h3>

              <p>
                {search ||
                category !== 'ALL'
                  ? 'Experimente alterar a pesquisa ou o filtro.'
                  : 'Comece por carregar o primeiro documento da sua empresa.'}
              </p>

              {!search &&
                category ===
                  'ALL' && (
                  <button
                    type="button"
                    className="empty-upload"
                    onClick={() =>
                      setShowUpload(
                        true,
                      )
                    }
                  >
                    <Upload
                      size={17}
                    />
                    Carregar documento
                  </button>
                )}
            </div>
          ) : (
            <div className="document-list">
              <div className="list-header">
                <span>
                  Documento
                </span>

                <span>
                  Categoria
                </span>

                <span>
                  Tamanho
                </span>

                <span>
                  Data
                </span>

                <span />
              </div>

              {filteredDocuments.map(
                (document) => {
                  const FileIcon =
                    getFileIcon(
                      document.mimeType,
                    );

                  const CategoryIcon =
                    getCategoryIcon(
                      document.category,
                    );

                  const url =
                    getDocumentUrl(
                      document,
                    );

                  return (
                    <div
                      className="document-row"
                      key={
                        document.id
                      }
                    >
                      <div className="document-main">
                        <div className="file-icon">
                          <FileIcon
                            size={23}
                          />
                        </div>

                        <div className="document-info">
                          <strong
                            title={
                              document.name
                            }
                          >
                            {document.name}
                          </strong>

                          <div className="document-meta">
                            <span>
                              {getExtension(
                                document.originalName,
                              )}
                            </span>

                            {document.invoice && (
                              <>
                                <i />
                                <span>
                                  {
                                    document
                                      .invoice
                                      .invoiceNumber
                                  }
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="category-badge">
                          <CategoryIcon
                            size={14}
                          />

                          {getCategoryLabel(
                            document.category,
                          )}
                        </span>
                      </div>

                      <div className="size-cell">
                        {formatDocumentSize(
                          document.size,
                        )}
                      </div>

                      <div className="date-cell">
                        {formatDate(
                          document.createdAt,
                        )}
                      </div>

                      <div className="actions">
                        {url && (
                          <button
                            type="button"
                            className="icon-button"
                            title="Abrir documento"
                            onClick={() =>
                              window.open(
                                url,
                                '_blank',
                                'noopener,noreferrer',
                              )
                            }
                          >
                            <Eye
                              size={18}
                            />
                          </button>
                        )}

                        <button
                          type="button"
                          className="icon-button"
                          title="Mais opções"
                          onClick={() =>
                            setOpenMenu(
                              openMenu ===
                                document.id
                                ? null
                                : document.id,
                            )
                          }
                        >
                          <MoreVertical
                            size={18}
                          />
                        </button>

                        {openMenu ===
                          document.id && (
                          <div className="action-menu">
                            {url && (
                              <button
                                type="button"
                                onClick={() => {
                                  window.open(
                                    url,
                                    '_blank',
                                    'noopener,noreferrer',
                                  );

                                  setOpenMenu(
                                    null,
                                  );
                                }}
                              >
                                <Download
                                  size={
                                    16
                                  }
                                />
                                Abrir documento
                              </button>
                            )}

                            <button
                              type="button"
                              className="danger"
                              disabled={
                                deletingId ===
                                document.id
                              }
                              onClick={() =>
                                handleDelete(
                                  document,
                                )
                              }
                            >
                              {deletingId ===
                              document.id ? (
                                <Loader2
                                  size={
                                    16
                                  }
                                  className="spin"
                                />
                              ) : (
                                <Trash2
                                  size={
                                    16
                                  }
                                />
                              )}

                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </section>

        {/* CATEGORIAS */}
        {summary && (
          <section className="category-section">
            <div className="section-heading">
              <div>
                <span>
                  Organização
                </span>

                <h2>
                  Documentos por categoria
                </h2>
              </div>
            </div>

            <div className="category-grid">
              {categories.map(
                (item) => {
                  const Icon =
                    getCategoryIcon(
                      item.value,
                    );

                  const count =
                    summary
                      .categories[
                      item.value
                    ];

                  return (
                    <button
                      type="button"
                      className={`category-card ${
                        category ===
                        item.value
                          ? 'active'
                          : ''
                      }`}
                      key={
                        item.value
                      }
                      onClick={() =>
                        setCategory(
                          item.value,
                        )
                      }
                    >
                      <div className="category-card-icon">
                        <Icon
                          size={19}
                        />
                      </div>

                      <div>
                        <strong>
                          {count}
                        </strong>

                        <span>
                          {
                            item.label
                          }
                        </span>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          </section>
        )}
      </main>

      {/* MODAL DE UPLOAD */}
      {showUpload && (
        <div
          className="upload-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeUpload();
            }
          }}
        >
          <div className="upload-modal">
            <div className="modal-header">
              <div className="modal-title-area">
                <div className="modal-icon">
                  <Upload
                    size={21}
                  />
                </div>

                <div>
                  <h2>
                    Carregar documento
                  </h2>

                  <p>
                    Adicione um novo
                    documento fiscal.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  closeUpload
                }
              >
                <X size={20} />
              </button>
            </div>

            <div
              className={`drop-zone ${
                dragging
                  ? 'dragging'
                  : ''
              } ${
                selectedFile
                  ? 'has-file'
                  : ''
              }`}
              onDragOver={(
                event,
              ) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() =>
                setDragging(false)
              }
              onDrop={
                handleDrop
              }
              onClick={() =>
                inputRef.current?.click()
              }
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={
                  handleFileChange
                }
                hidden
              />

              {selectedFile ? (
                <>
                  <div className="selected-file-icon">
                    <FileText
                      size={29}
                    />
                  </div>

                  <strong>
                    {selectedFile.name}
                  </strong>

                  <span>
                    {formatDocumentSize(
                      selectedFile.size,
                    )}
                  </span>

                  <button
                    type="button"
                    className="change-file"
                    onClick={(
                      event,
                    ) => {
                      event.stopPropagation();

                      inputRef.current?.click();
                    }}
                  >
                    Alterar ficheiro
                  </button>
                </>
              ) : (
                <>
                  <div className="drop-icon">
                    <Upload
                      size={31}
                    />
                  </div>

                  <strong>
                    Arraste o ficheiro
                    para aqui
                  </strong>

                  <span>
                    ou clique para
                    seleccionar
                  </span>

                  <small>
                    PDF, JPG, PNG ou WEBP
                    · máximo 10 MB
                  </small>
                </>
              )}
            </div>

            <div className="form-grid">
              <div className="field full">
                <label>
                  Nome do documento
                </label>

                <input
                  value={
                    documentName
                  }
                  onChange={(event) =>
                    setDocumentName(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Ex.: Factura de Janeiro"
                />
              </div>

              <div className="field">
                <label>
                  Categoria
                </label>

                <select
                  value={
                    documentCategory
                  }
                  onChange={(event) =>
                    setDocumentCategory(
                      event.target
                        .value as DocumentCategory,
                    )
                  }
                >
                  {categories.map(
                    (item) => (
                      <option
                        key={
                          item.value
                        }
                        value={
                          item.value
                        }
                      >
                        {item.label}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="field">
                <label>
                  Descrição
                </label>

                <input
                  value={
                    documentDescription
                  }
                  onChange={(event) =>
                    setDocumentDescription(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="cancel-button"
                disabled={uploading}
                onClick={
                  closeUpload
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="submit-upload"
                disabled={
                  !selectedFile ||
                  uploading
                }
                onClick={
                  handleUpload
                }
              >
                {uploading ? (
                  <>
                    <Loader2
                      size={18}
                      className="spin"
                    />
                    A enviar...
                  </>
                ) : (
                  <>
                    <Upload
                      size={18}
                    />
                    Enviar documento
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        .documents-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background: #f7f8fc;
          color: #172033;
        }

        .page-background {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(
              circle at 10% 0%,
              rgba(89, 64, 215, 0.08),
              transparent 28%
            ),
            radial-gradient(
              circle at 90% 10%,
              rgba(156, 108, 255, 0.07),
              transparent 25%
            );
        }

        .documents-container {
          position: relative;
          max-width: 1420px;
          margin: 0 auto;
          padding: 38px 32px 60px;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 30px;
          margin-bottom: 30px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #5940d7;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          margin-bottom: 11px;
        }

        .hero h1 {
          margin: 0;
          font-size: clamp(30px, 3vw, 46px);
          line-height: 1.05;
          letter-spacing: -0.045em;
          font-weight: 850;
          color: #171c2c;
        }

        .hero h1 span {
          display: block;
          color: #5940d7;
        }

        .hero p {
          max-width: 680px;
          margin: 15px 0 0;
          color: #727a8c;
          line-height: 1.65;
          font-size: 15px;
        }

        .upload-button,
        .empty-upload,
        .submit-upload {
          border: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          background: #5940d7;
          color: white;
          font-weight: 750;
          border-radius: 13px;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(89, 64, 215, 0.2);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .upload-button {
          padding: 13px 19px;
          white-space: nowrap;
        }

        .upload-button:hover,
        .empty-upload:hover,
        .submit-upload:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 14px 30px rgba(89, 64, 215, 0.26);
          background: #4d35c6;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 650;
        }

        .alert span {
          flex: 1;
        }

        .alert button {
          border: 0;
          background: transparent;
          cursor: pointer;
          display: flex;
        }

        .error-alert {
          color: #a52c35;
          background: #fff0f1;
          border: 1px solid #ffd4d8;
        }

        .success-alert {
          color: #18754a;
          background: #effbf4;
          border: 1px solid #c8eed9;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .stat-card {
          min-height: 124px;
          padding: 21px;
          display: flex;
          align-items: center;
          gap: 15px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e9ebf2;
          border-radius: 17px;
          box-shadow: 0 8px 30px rgba(31, 38, 58, 0.045);
        }

        .stat-card.featured {
          border-color: rgba(89, 64, 215, 0.18);
          background: linear-gradient(
            135deg,
            rgba(89, 64, 215, 0.08),
            white
          );
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #5940d7;
          background: #f0edff;
        }

        .stat-icon.blue {
          color: #2875d9;
          background: #edf5ff;
        }

        .stat-icon.green {
          color: #198a57;
          background: #eaf9f1;
        }

        .stat-icon.purple {
          color: #8c49c6;
          background: #f6edff;
        }

        .stat-card span,
        .stat-card small {
          display: block;
        }

        .stat-card span {
          color: #7a8292;
          font-size: 12px;
          font-weight: 650;
          margin-bottom: 5px;
        }

        .stat-card strong {
          display: block;
          color: #202637;
          font-size: 27px;
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .stat-card small {
          color: #a0a6b3;
          margin-top: 6px;
          font-size: 11px;
        }

        .documents-card {
          background: #ffffff;
          border: 1px solid #e8eaf0;
          border-radius: 19px;
          box-shadow: 0 12px 35px rgba(28, 36, 58, 0.05);
          overflow: visible;
        }

        .toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px;
          border-bottom: 1px solid #eef0f4;
        }

        .search-box {
          height: 45px;
          flex: 1;
          max-width: 650px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 13px;
          color: #8c94a4;
          background: #f8f9fb;
          border: 1px solid #e9ebf0;
          border-radius: 11px;
        }

        .search-box input {
          width: 100%;
          height: 100%;
          outline: none;
          border: 0;
          background: transparent;
          color: #252b3b;
          font-size: 13px;
        }

        .search-box input::placeholder {
          color: #a6adba;
        }

        .search-box button {
          border: 0;
          background: transparent;
          color: #8e95a3;
          display: flex;
          cursor: pointer;
        }

        .filter-box {
          height: 45px;
          min-width: 215px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          color: #737b8d;
          background: #f8f9fb;
          border: 1px solid #e9ebf0;
          border-radius: 11px;
        }

        .filter-box select {
          appearance: none;
          flex: 1;
          border: 0;
          outline: 0;
          background: transparent;
          color: #353c4d;
          font-size: 13px;
          cursor: pointer;
        }

        .document-list {
          width: 100%;
        }

        .list-header,
        .document-row {
          display: grid;
          grid-template-columns: minmax(280px, 2.2fr) 1.25fr 0.75fr 0.9fr 70px;
          align-items: center;
        }

        .list-header {
          min-height: 43px;
          padding: 0 20px;
          color: #9299a7;
          background: #fafbfc;
          border-bottom: 1px solid #eef0f3;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .document-row {
          position: relative;
          min-height: 82px;
          padding: 13px 20px;
          border-bottom: 1px solid #f0f1f4;
          transition: background 0.18s ease;
        }

        .document-row:last-child {
          border-bottom: 0;
        }

        .document-row:hover {
          background: #fbfbfe;
        }

        .document-main {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .file-icon {
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          color: #5940d7;
          background: #f1efff;
        }

        .document-info {
          min-width: 0;
        }

        .document-info strong {
          display: block;
          max-width: 400px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          color: #2b3140;
          font-size: 13px;
          font-weight: 750;
        }

        .document-meta {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 6px;
          color: #9ca3b0;
          font-size: 10px;
          font-weight: 700;
        }

        .document-meta i {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #b7bcc6;
        }

        .category-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border-radius: 8px;
          color: #656d7c;
          background: #f5f6f8;
          font-size: 11px;
          font-weight: 700;
        }

        .size-cell,
        .date-cell {
          color: #747c8c;
          font-size: 12px;
          font-weight: 600;
        }

        .actions {
          position: relative;
          display: flex;
          justify-content: flex-end;
          gap: 5px;
        }

        .icon-button {
          width: 35px;
          height: 35px;
          border: 1px solid transparent;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7b8392;
          background: transparent;
          cursor: pointer;
        }

        .icon-button:hover {
          color: #5940d7;
          background: #f2efff;
          border-color: #e8e3ff;
        }

        .action-menu {
          position: absolute;
          z-index: 30;
          top: 39px;
          right: 0;
          min-width: 165px;
          padding: 6px;
          border: 1px solid #e7e9ef;
          border-radius: 11px;
          background: white;
          box-shadow: 0 14px 35px rgba(30, 37, 56, 0.14);
        }

        .action-menu button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 10px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #505868;
          font-size: 12px;
          font-weight: 650;
          text-align: left;
          cursor: pointer;
        }

        .action-menu button:hover {
          background: #f6f7f9;
        }

        .action-menu button.danger {
          color: #c23843;
        }

        .action-menu button.danger:hover {
          background: #fff1f2;
        }

        .empty-state {
          min-height: 360px;
          padding: 60px 25px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #8d95a4;
        }

        .empty-icon {
          width: 66px;
          height: 66px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          color: #5940d7;
          background: #f1efff;
          margin-bottom: 17px;
        }

        .empty-state h3 {
          margin: 0;
          color: #343b4b;
          font-size: 17px;
        }

        .empty-state p {
          max-width: 450px;
          margin: 8px 0 20px;
          color: #969dab;
          font-size: 13px;
          line-height: 1.55;
        }

        .empty-upload {
          padding: 10px 15px;
          font-size: 12px;
        }

        .category-section {
          margin-top: 34px;
        }

        .section-heading {
          margin-bottom: 15px;
        }

        .section-heading span {
          color: #8d95a4;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .section-heading h2 {
          margin: 5px 0 0;
          color: #272d3d;
          font-size: 21px;
          letter-spacing: -0.02em;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 11px;
        }

        .category-card {
          min-height: 82px;
          padding: 13px;
          display: flex;
          align-items: center;
          gap: 11px;
          text-align: left;
          border: 1px solid #e9ebf0;
          border-radius: 13px;
          background: white;
          cursor: pointer;
          transition: 0.18s ease;
        }

        .category-card:hover,
        .category-card.active {
          border-color: rgba(89, 64, 215, 0.28);
          background: #faf9ff;
          transform: translateY(-1px);
        }

        .category-card-icon {
          width: 37px;
          height: 37px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          color: #5940d7;
          background: #f1efff;
        }

        .category-card strong,
        .category-card span {
          display: block;
        }

        .category-card strong {
          color: #2c3242;
          font-size: 18px;
          line-height: 1;
        }

        .category-card span {
          margin-top: 5px;
          color: #8c94a3;
          font-size: 10px;
          font-weight: 650;
        }

        .upload-overlay {
          position: fixed;
          z-index: 1000;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(19, 23, 35, 0.48);
          backdrop-filter: blur(5px);
        }

        .upload-modal {
          width: min(590px, 100%);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          border: 1px solid #e8e9ef;
          border-radius: 20px;
          background: white;
          box-shadow: 0 30px 80px rgba(22, 27, 42, 0.23);
          animation: modalIn 0.2s ease;
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.985);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 21px 22px;
          border-bottom: 1px solid #eef0f4;
        }

        .modal-title-area {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-icon {
          width: 43px;
          height: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          color: #5940d7;
          background: #f0edff;
        }

        .modal-header h2 {
          margin: 0;
          color: #262c3b;
          font-size: 17px;
        }

        .modal-header p {
          margin: 4px 0 0;
          color: #9299a7;
          font-size: 11px;
        }

        .modal-header > button {
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 9px;
          background: #f5f6f8;
          color: #757d8b;
          cursor: pointer;
        }

        .drop-zone {
          margin: 21px 22px 19px;
          min-height: 190px;
          padding: 30px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border: 1.5px dashed #d6d2f5;
          border-radius: 15px;
          background: #fbfaff;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .drop-zone:hover,
        .drop-zone.dragging {
          border-color: #5940d7;
          background: #f7f5ff;
        }

        .drop-zone.has-file {
          border-style: solid;
          border-color: #c9c2f4;
        }

        .drop-icon,
        .selected-file-icon {
          width: 57px;
          height: 57px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          color: #5940d7;
          background: #efecff;
          margin-bottom: 12px;
        }

        .selected-file-icon {
          color: #168454;
          background: #eaf9f1;
        }

        .drop-zone strong {
          max-width: 440px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #33394a;
          font-size: 14px;
        }

        .drop-zone > span {
          margin-top: 5px;
          color: #939aa8;
          font-size: 12px;
        }

        .drop-zone small {
          margin-top: 13px;
          color: #a9afba;
          font-size: 10px;
        }

        .change-file {
          margin-top: 13px;
          border: 0;
          background: transparent;
          color: #5940d7;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          padding: 0 22px 21px;
        }

        .field {
          min-width: 0;
        }

        .field.full {
          grid-column: 1 / -1;
        }

        .field label {
          display: block;
          margin-bottom: 6px;
          color: #646c7b;
          font-size: 11px;
          font-weight: 750;
        }

        .field input,
        .field select {
          width: 100%;
          height: 42px;
          padding: 0 12px;
          border: 1px solid #e2e4e9;
          border-radius: 9px;
          outline: none;
          color: #323847;
          background: white;
          font-size: 12px;
          transition: 0.15s ease;
        }

        .field input:focus,
        .field select:focus {
          border-color: #aaa0ec;
          box-shadow: 0 0 0 3px rgba(89, 64, 215, 0.07);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding: 16px 22px;
          border-top: 1px solid #eef0f4;
          background: #fbfcfd;
          border-radius: 0 0 20px 20px;
        }

        .cancel-button,
        .submit-upload {
          min-height: 40px;
          padding: 0 15px;
          border-radius: 9px;
          font-size: 12px;
          cursor: pointer;
        }

        .cancel-button {
          border: 1px solid #e1e3e8;
          background: white;
          color: #687080;
          font-weight: 700;
        }

        .cancel-button:hover {
          background: #f7f8fa;
        }

        .submit-upload:disabled,
        .cancel-button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .spin {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1100px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .category-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .list-header {
            display: none;
          }

          .document-row {
            grid-template-columns: 1fr auto;
            gap: 10px;
            padding: 16px 18px;
          }

          .document-row > div:nth-child(2),
          .document-row > div:nth-child(3),
          .document-row > div:nth-child(4) {
            display: none;
          }
        }

        @media (max-width: 700px) {
          .documents-container {
            padding: 25px 15px 45px;
          }

          .hero {
            align-items: flex-start;
            flex-direction: column;
          }

          .upload-button {
            width: 100%;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .search-box {
            max-width: none;
          }

          .filter-box {
            width: 100%;
          }

          .category-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .field.full {
            grid-column: auto;
          }

          .modal-footer {
            flex-direction: column-reverse;
          }

          .cancel-button,
          .submit-upload {
            width: 100%;
          }
        }

        @media (max-width: 440px) {
          .category-grid {
            grid-template-columns: 1fr;
          }

          .hero h1 {
            font-size: 31px;
          }

          .document-info strong {
            max-width: 220px;
          }
        }
      `}</style>
    </div>
  );
}