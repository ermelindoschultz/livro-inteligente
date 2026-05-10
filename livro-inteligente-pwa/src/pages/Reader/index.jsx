import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, BookOpenText, LoaderCircle, TriangleAlert } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { openBook } from '../../services/bookDownload.js'
import { BOOKS_CHANGED_EVENT, getStoredBookById } from '../../services/db.js'
import { formatAuthors, formatDate } from '../../utils/formatters.js'

function ReaderNotFound({ reason }) {
  return (
    <section className="rounded-[28px] border border-dashed border-[var(--color-line)] bg-[rgba(255,251,244,0.6)] p-8 shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Leitor</p>
      <h1 className="font-display mt-4 text-3xl text-[var(--color-ink)]">Livro indisponivel offline</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{reason}</p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[rgba(255,255,255,0.62)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para a estante
      </Link>
    </section>
  )
}

export default function ReaderPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [openState, setOpenState] = useState({ status: 'idle', error: null, mode: null })
  const numericBookId = Number(id)
  const hasValidId = Number.isInteger(numericBookId) && numericBookId > 0

  useEffect(() => {
    const handleBooksChanged = () => {
      if (hasValidId) {
        queryClient.invalidateQueries({ queryKey: ['stored-book', numericBookId] })
      }
    }

    window.addEventListener(BOOKS_CHANGED_EVENT, handleBooksChanged)
    return () => {
      window.removeEventListener(BOOKS_CHANGED_EVENT, handleBooksChanged)
    }
  }, [hasValidId, numericBookId, queryClient])

  const bookQuery = useQuery({
    queryKey: ['stored-book', numericBookId],
    queryFn: () => getStoredBookById(numericBookId),
    enabled: hasValidId,
    staleTime: 5_000,
  })

  if (!hasValidId) {
    return <ReaderNotFound reason="O identificador informado na rota nao e valido." />
  }

  if (bookQuery.isLoading) {
    return (
      <section className="rounded-[28px] border border-[var(--color-line)] bg-[var(--color-paper)] p-6 shadow-[var(--shadow-card)]">
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Carregando livro
        </div>
      </section>
    )
  }

  const book = bookQuery.data

  if (!book || !book.isDownloaded) {
    return (
      <ReaderNotFound reason="Este livro ainda nao foi baixado neste dispositivo, entao a rota nao consegue montar o leitor offline." />
    )
  }

  const metadata = book.metadataSnapshot
  const chapters = Array.isArray(metadata?.chapters) ? metadata.chapters.length : 0

  const handleOpenBook = async () => {
    try {
      setOpenState({ status: 'pending', error: null, mode: null })
      const result = await openBook(book)
      setOpenState({ status: 'completed', error: null, mode: result.mode })
      queryClient.invalidateQueries({ queryKey: ['stored-book', numericBookId] })
    } catch (error) {
      setOpenState({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Falha ao abrir o livro.',
        mode: null,
      })
    }
  }

  return (
    <section className="rounded-[32px] border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-6 shadow-[var(--shadow-card)] backdrop-blur-md sm:px-7 sm:py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[rgba(255,255,255,0.56)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para a estante
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--color-muted)]">
            Livro {book.id}
          </p>
          <h1 className="font-display mt-3 text-[2.6rem] leading-[0.96] text-[var(--color-ink)] text-balance sm:text-[3.4rem]">
            {book.title}
          </h1>
          <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">{formatAuthors(book.authors)}</p>
        </div>

        <div className="rounded-full border border-[rgba(35,92,59,0.18)] bg-[var(--color-success-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--color-success)]">
          leitura offline pronta
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[22px] border border-[var(--color-line)] bg-[rgba(255,255,255,0.56)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Publicacao</p>
          <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">{formatDate(book.publishedAt)}</p>
        </div>
        <div className="rounded-[22px] border border-[var(--color-line)] bg-[rgba(255,255,255,0.56)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Arquivos</p>
          <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">{book.cachedFileCount || 0} de {book.fileCount || 0}</p>
        </div>
        <div className="rounded-[22px] border border-[var(--color-line)] bg-[rgba(255,255,255,0.56)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Capitulos</p>
          <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">{chapters}</p>
        </div>
      </div>

      {book.description ? (
        <p className="mt-6 text-sm leading-7 text-[var(--color-muted)]">{book.description}</p>
      ) : null}

      {openState.error ? (
        <div className="mt-6 rounded-[24px] border border-[rgba(138,69,48,0.18)] bg-[var(--color-danger-soft)] px-4 py-4 text-sm text-[var(--color-danger)]">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="leading-6">{openState.error}</p>
          </div>
        </div>
      ) : null}

      {openState.status === 'completed' ? (
        <div className="mt-6 rounded-[24px] border border-[rgba(35,92,59,0.18)] bg-[var(--color-success-soft)] px-4 py-4 text-sm text-[var(--color-success)]">
          <div className="flex items-start gap-3">
            <BookOpenText className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="leading-6">
              O conteudo foi aberto em uma nova aba no modo {openState.mode === 'offline' ? 'offline' : 'online'}.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleOpenBook}
          disabled={openState.status === 'pending'}
          className="inline-flex items-center gap-2 rounded-full border border-transparent bg-[var(--color-ink)] px-5 py-3 text-sm font-semibold text-[#fffaf2] shadow-[0_16px_32px_rgba(47,36,25,0.18)] disabled:cursor-wait disabled:opacity-80"
        >
          {openState.status === 'pending' ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <BookOpenText className="h-4 w-4" />
          )}
          {openState.status === 'pending' ? 'Abrindo leitura' : 'Abrir leitura'}
        </button>
      </div>
    </section>
  )
}