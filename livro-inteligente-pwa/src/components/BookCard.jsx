import DownloadButton from './DownloadButton.jsx'
import ProgressBar from './ProgressBar.jsx'
import { formatAuthors, formatDate } from '../utils/formatters.js'

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

export default function BookCard({ book, openingBookId, uiState, onDownload, onOpen, onDelete }) {
  const actionState = getActionState(book, uiState)

  return (
    <article className="rounded-[28px] border border-[var(--color-line)] bg-[var(--color-paper)] p-5 shadow-[var(--shadow-card)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--color-muted)]">
            Livro {book.id}
          </p>
          <h2 className="font-display mt-3 text-[1.8rem] leading-[1.05] text-[var(--color-ink)] text-balance">
            {book.title}
          </h2>
        </div>
        <div className="rounded-full border border-[var(--color-line)] bg-[rgba(255,255,255,0.54)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">
          {book.isDownloaded ? 'pronto para ler' : 'disponivel para baixar'}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">{formatAuthors(book.authors)}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[var(--color-muted)]">
        <span className="rounded-full bg-[rgba(255,255,255,0.6)] px-3 py-1">
          Publicacao {formatDate(book.publishedAt)}
        </span>
        <span className="rounded-full bg-[rgba(255,255,255,0.6)] px-3 py-1">
          {book.isDownloaded
            ? 'Leitura offline disponivel'
            : actionState.status === 'pending'
              ? 'Preparando sua leitura'
              : 'Baixe para ler quando quiser'}
        </span>
      </div>

      {actionState.status === 'pending' ? <ProgressBar value={actionState.progress} /> : null}

      {actionState.error ? (
        <p className="mt-4 rounded-2xl border border-[rgba(138,69,48,0.18)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {actionState.error}
        </p>
      ) : null}

      <div className="mt-5">
        <DownloadButton
          book={book}
          openingBookId={openingBookId}
          state={actionState}
          onDownload={onDownload}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      </div>
    </article>
  )
}