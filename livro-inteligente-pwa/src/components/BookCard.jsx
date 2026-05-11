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
    <article className="border-2 border-[var(--color-line)] bg-[var(--color-paper)] p-5 shadow-[var(--shadow-card)] transition-transform duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-accent)] font-[var(--font-pixel)]">
            Livro {book.id}
          </p>
          <h2 className="mt-3 text-[1.4rem] leading-[1.15] text-[var(--color-ink)] text-balance font-[var(--font-display)]">
            {book.title}
          </h2>
        </div>
        <div className="shrink-0 border border-[var(--color-line)] bg-[rgba(232,168,32,0.08)] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--color-muted)] font-[var(--font-pixel)]">
          {book.isDownloaded ? '▶ pronto' : '↓ baixar'}
        </div>
      </div>

      <p className="mt-4 text-base leading-6 text-[var(--color-muted)] font-[var(--font-sans)]">{formatAuthors(book.authors)}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[var(--color-muted)]">
        <span className="border border-[var(--color-line)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[10px] font-[var(--font-pixel)]">
          {formatDate(book.publishedAt)}
        </span>
        <span className="border border-[var(--color-line)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[10px] font-[var(--font-pixel)]">
          {book.isDownloaded
            ? 'offline ✓'
            : actionState.status === 'pending'
              ? 'baixando...'
              : 'sem offline'}
        </span>
      </div>

      {actionState.status === 'pending' ? <ProgressBar value={actionState.progress} /> : null}

      {actionState.error ? (
        <p className="mt-4 border-2 border-[rgba(232,64,64,0.4)] bg-[var(--color-danger-soft)] px-3 py-2 text-[11px] leading-relaxed text-[var(--color-danger)] font-[var(--font-pixel)]">
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