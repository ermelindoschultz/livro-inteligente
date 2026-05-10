import { useEffect, useState, startTransition } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookOpenText,
  CheckCircle2,
  CloudDownload,
  ExternalLink,
  LibraryBig,
  LoaderCircle,
  RefreshCcw,
  TriangleAlert,
  WifiOff,
} from 'lucide-react'
import {
  apiBaseUrl,
  ApiConfigurationError,
  fetchBooks,
  r2PublicRoot,
} from './lib/books-api.js'
import {
  BOOKS_CHANGED_EVENT,
  ensureBookRecord,
  listStoredBooks,
  syncRemoteBooks,
} from './lib/db.js'
import { downloadBook, openBook } from './lib/download-engine.js'
import { useConnectivity } from './lib/use-connectivity.js'

function sortBooks(left, right) {
  if (left.isDownloaded !== right.isDownloaded) {
    return Number(right.isDownloaded) - Number(left.isDownloaded)
  }

  return left.title.localeCompare(right.title, 'pt-BR', {
    sensitivity: 'base',
    numeric: true,
  })
}

function formatAuthors(authors) {
  if (!Array.isArray(authors) || authors.length === 0) {
    return 'Equipe Livro Inteligente'
  }

  return authors.join(' • ')
}

function formatDate(value) {
  if (!value) {
    return 'sem data'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'sem data'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getActionState(book, uiState) {
  if (uiState?.status === 'pending') {
    return uiState
  }

  return {
    status: uiState?.status ?? book.downloadStatus ?? 'idle',
    progress: uiState?.progress ?? book.downloadProgress ?? 0,
    error: uiState?.error ?? null,
  }
}

function ShelfSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-[26px] border border-[var(--color-line)] bg-[var(--color-paper)] p-5 shadow-[var(--shadow-card)]"
        >
          <div className="h-4 w-24 rounded-full bg-[var(--color-accent-soft)]" />
          <div className="mt-4 h-8 w-2/3 rounded-full bg-[rgba(47,36,25,0.08)]" />
          <div className="mt-3 h-4 w-full rounded-full bg-[rgba(47,36,25,0.06)]" />
          <div className="mt-2 h-4 w-4/5 rounded-full bg-[rgba(47,36,25,0.06)]" />
          <div className="mt-5 h-12 rounded-2xl bg-[rgba(47,36,25,0.08)]" />
        </div>
      ))}
    </div>
  )
}

function ActionButton({ book, openingBookId, state, onDownload, onOpen }) {
  if (!book.publicUrl) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-line)] bg-[rgba(255,255,255,0.7)] px-4 py-3 text-sm font-semibold text-[var(--color-muted)]"
      >
        <TriangleAlert className="h-4 w-4" />
        Sem origem pública
      </button>
    )
  }

  if (state.status === 'pending') {
    return (
      <button
        type="button"
        disabled
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-transparent bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[#fff7ec] shadow-[0_14px_30px_rgba(159,111,42,0.24)]"
      >
        <LoaderCircle className="h-4 w-4 animate-spin" />
        {state.progress}% salvo offline
      </button>
    )
  }

  if (book.isDownloaded || state.status === 'completed') {
    return (
      <button
        type="button"
        onClick={() => onOpen(book)}
        disabled={openingBookId === book.id}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(35,92,59,0.18)] bg-[var(--color-success-soft)] px-4 py-3 text-sm font-semibold text-[var(--color-success)]"
      >
        {openingBookId === book.id ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        {openingBookId === book.id ? 'Abrindo' : 'Abrir'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onDownload(book)}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-transparent bg-[var(--color-ink)] px-4 py-3 text-sm font-semibold text-[#fffaf2] shadow-[0_16px_32px_rgba(47,36,25,0.18)]"
    >
      <CloudDownload className="h-4 w-4" />
      Baixar para offline
    </button>
  )
}

function BookCard({ book, openingBookId, uiState, onDownload, onOpen }) {
  const actionState = getActionState(book, uiState)

  return (
    <article className="rounded-[28px] border border-[var(--color-line)] bg-[var(--color-paper)] p-5 shadow-[var(--shadow-card)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--color-muted)]">
            ID {book.id}
          </p>
          <h2 className="font-display mt-3 text-[1.8rem] leading-[1.05] text-[var(--color-ink)] text-balance">
            {book.title}
          </h2>
        </div>
        <div className="rounded-full border border-[var(--color-line)] bg-[rgba(255,255,255,0.54)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">
          {book.isDownloaded ? 'offline' : 'nuvem'}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">{formatAuthors(book.authors)}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[var(--color-muted)]">
        <span className="rounded-full bg-[rgba(255,255,255,0.6)] px-3 py-1">Publicação {formatDate(book.publishedAt)}</span>
        <span className="rounded-full bg-[rgba(255,255,255,0.6)] px-3 py-1">{book.cachedFileCount || 0}/{book.fileCount || 0} arquivos</span>
      </div>

      {book.description ? (
        <p className="mt-4 text-sm leading-6 text-[var(--color-ink)]/80">{book.description}</p>
      ) : null}

      {actionState.status === 'pending' ? (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            <span>Sincronizando biblioteca local</span>
            <span>{actionState.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[rgba(47,36,25,0.08)]">
            <div
              className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-300"
              style={{ width: `${actionState.progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {actionState.error ? (
        <p className="mt-4 rounded-2xl border border-[rgba(138,69,48,0.18)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {actionState.error}
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <ActionButton
          book={book}
          openingBookId={openingBookId}
          state={actionState}
          onDownload={onDownload}
          onOpen={onOpen}
        />
        <a
          href={book.publicUrl ?? '#'}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${
            book.publicUrl
              ? 'border-[var(--color-line)] bg-[rgba(255,255,255,0.6)] text-[var(--color-ink)]'
              : 'pointer-events-none border-[var(--color-line)] bg-[rgba(255,255,255,0.35)] text-[var(--color-muted)]'
          }`}
        >
          <ExternalLink className="h-4 w-4" />
          Origem
        </a>
      </div>
    </article>
  )
}

function EmptyState({ isOnline, hasConfig }) {
  return (
    <section className="rounded-[28px] border border-dashed border-[var(--color-line)] bg-[rgba(255,251,244,0.5)] p-8 text-center shadow-[var(--shadow-card)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
        <LibraryBig className="h-8 w-8" />
      </div>
      <h2 className="font-display mt-5 text-3xl text-[var(--color-ink)]">Nenhum livro visível</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
        {isOnline
          ? hasConfig
            ? 'A API ainda não retornou livros disponíveis. Assim que houver títulos em SUCCESS, eles aparecem aqui.'
            : 'Defina VITE_API_BASE_URL para sincronizar a estante com a API de livros.'
          : 'Sem conexão, a estante mostra apenas os livros já baixados no dispositivo.'}
      </p>
    </section>
  )
}

function App() {
  const queryClient = useQueryClient()
  const { isOnline } = useConnectivity()
  const [downloadStates, setDownloadStates] = useState({})
  const [openingBookId, setOpeningBookId] = useState(null)

  useEffect(() => {
    const handleBooksChanged = () => {
      queryClient.invalidateQueries({ queryKey: ['stored-books'] })
    }

    window.addEventListener(BOOKS_CHANGED_EVENT, handleBooksChanged)
    return () => {
      window.removeEventListener(BOOKS_CHANGED_EVENT, handleBooksChanged)
    }
  }, [queryClient])

  const storedBooksQuery = useQuery({
    queryKey: ['stored-books'],
    queryFn: listStoredBooks,
    initialData: [],
    staleTime: 5_000,
  })

  const syncBooksQuery = useQuery({
    queryKey: ['books-sync', apiBaseUrl],
    enabled: isOnline,
    queryFn: async () => {
      const books = await fetchBooks()
      await syncRemoteBooks(books)
      return books
    },
    retry: 1,
  })

  useEffect(() => {
    if (!syncBooksQuery.data) {
      return
    }

    queryClient.invalidateQueries({ queryKey: ['stored-books'] })
  }, [syncBooksQuery.data, queryClient])

  const books = [...(storedBooksQuery.data ?? [])].sort(sortBooks)
  const visibleBooks = isOnline ? books : books.filter((book) => book.isDownloaded)
  const downloadedCount = books.filter((book) => book.isDownloaded).length
  const syncingCount = Object.values(downloadStates).filter((state) => state.status === 'pending').length
  const syncError = syncBooksQuery.error
  const hasApiConfig = Boolean(apiBaseUrl)
  const hasR2Config = Boolean(r2PublicRoot)

  const syncErrorMessage =
    syncError instanceof ApiConfigurationError
      ? 'Configure VITE_API_BASE_URL para iniciar a prateleira a partir da API.'
      : syncError?.message ?? null

  const handleDownload = async (book) => {
    try {
      await ensureBookRecord(book)
      startTransition(() => {
        setDownloadStates((current) => ({
          ...current,
          [book.id]: { status: 'pending', progress: 0, error: null },
        }))
      })

      await downloadBook(book, {
        onProgress: ({ percent }) => {
          startTransition(() => {
            setDownloadStates((current) => ({
              ...current,
              [book.id]: { status: 'pending', progress: percent, error: null },
            }))
          })
        },
      })

      startTransition(() => {
        setDownloadStates((current) => ({
          ...current,
          [book.id]: { status: 'completed', progress: 100, error: null },
        }))
      })
      queryClient.invalidateQueries({ queryKey: ['stored-books'] })
    } catch (error) {
      startTransition(() => {
        setDownloadStates((current) => ({
          ...current,
          [book.id]: {
            status: 'failed',
            progress: 0,
            error: error instanceof Error ? error.message : 'Falha ao baixar o livro.',
          },
        }))
      })
      queryClient.invalidateQueries({ queryKey: ['stored-books'] })
    }
  }

  const handleOpen = async (book) => {
    try {
      setOpeningBookId(book.id)
      await openBook(book)
    } catch (error) {
      startTransition(() => {
        setDownloadStates((current) => ({
          ...current,
          [book.id]: {
            status: 'failed',
            progress: current[book.id]?.progress ?? 0,
            error: error instanceof Error ? error.message : 'Falha ao abrir o livro.',
          },
        }))
      })
    } finally {
      setOpeningBookId(null)
    }
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['books-sync', apiBaseUrl] })
  }

  const showSkeleton = storedBooksQuery.isLoading || (isOnline && syncBooksQuery.isLoading && books.length === 0)

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-10 pt-5 sm:px-6 sm:pb-14 sm:pt-8">
      <div className="pointer-events-none absolute inset-x-0 top-[-160px] h-[360px] rounded-full bg-[radial-gradient(circle,_rgba(159,111,42,0.18),_transparent_62%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-80px] top-[28%] h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(84,120,100,0.14),_transparent_66%)] blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-5">
        <header className="rounded-[32px] border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-6 shadow-[var(--shadow-card)] backdrop-blur-md sm:px-7 sm:py-8">
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[rgba(255,255,255,0.48)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted)]">
              <BookOpenText className="h-3.5 w-3.5" />
              Book Shelf
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-line)] bg-[rgba(255,255,255,0.58)] text-[var(--color-ink)] transition-transform duration-300 hover:rotate-12"
              aria-label="Atualizar estante"
            >
              <RefreshCcw className={`h-4 w-4 ${syncBooksQuery.isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <h1 className="font-display mt-5 max-w-[12ch] text-[3rem] leading-[0.92] text-[var(--color-ink)] text-balance sm:text-[4.4rem]">
            Estante offline para leitura sem atrito.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
            A prateleira sincroniza a lista de livros da API, persiste o catálogo no IndexedDB com Dexie e baixa os ativos para caches nomeados por livro.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-[22px] border border-[var(--color-line)] bg-[rgba(255,255,255,0.56)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Catálogo</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{books.length}</p>
            </div>
            <div className="rounded-[22px] border border-[var(--color-line)] bg-[rgba(255,255,255,0.56)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Offline</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{downloadedCount}</p>
            </div>
            <div className="rounded-[22px] border border-[var(--color-line)] bg-[rgba(255,255,255,0.56)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Em fila</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{syncingCount}</p>
            </div>
            <div className="rounded-[22px] border border-[var(--color-line)] bg-[rgba(255,255,255,0.56)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Conexão</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{isOnline ? 'online' : 'offline'}</p>
            </div>
          </div>

          <p className="mt-5 text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
            API {hasApiConfig ? apiBaseUrl : 'não configurada'}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
            R2 {hasR2Config ? r2PublicRoot : 'não configurado'}
          </p>
        </header>

        {!isOnline ? (
          <section className="rounded-[24px] border border-[rgba(138,69,48,0.14)] bg-[rgba(255,244,234,0.86)] px-4 py-4 text-sm text-[var(--color-danger)] shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-3">
              <WifiOff className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="leading-6">
                Você está offline. A estante prioriza apenas os títulos já baixados e mantém a navegação resiliente mesmo sem API.
              </p>
            </div>
          </section>
        ) : null}

        {syncErrorMessage ? (
          <section className="rounded-[24px] border border-[rgba(138,69,48,0.14)] bg-[rgba(255,244,234,0.86)] px-4 py-4 text-sm text-[var(--color-danger)] shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="leading-6">{syncErrorMessage}</p>
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          {showSkeleton ? (
            <ShelfSkeleton />
          ) : visibleBooks.length > 0 ? (
            visibleBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                openingBookId={openingBookId}
                uiState={downloadStates[book.id]}
                onDownload={handleDownload}
                onOpen={handleOpen}
              />
            ))
          ) : (
            <EmptyState isOnline={isOnline} hasConfig={hasApiConfig} />
          )}
        </section>
      </div>
    </main>
  )
}

export default App
