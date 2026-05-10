import { CheckCircle2, CloudDownload, LoaderCircle, TriangleAlert, Trash2 } from 'lucide-react'

export default function DownloadButton({
  book,
  openingBookId,
  state,
  onDownload,
  onOpen,
  onDelete,
}) {
  if (!book.publicUrl) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-line)] bg-[rgba(255,255,255,0.7)] px-4 py-3 text-sm font-semibold text-[var(--color-muted)]"
      >
        <TriangleAlert className="h-4 w-4" />
        Indisponivel no momento
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
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onOpen(book)}
          disabled={openingBookId === book.id}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(35,92,59,0.18)] bg-[var(--color-success-soft)] px-4 py-3 text-sm font-semibold text-[var(--color-success)]"
        >
          {openingBookId === book.id ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {openingBookId === book.id ? 'Abrindo' : 'Abrir'}
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(book)}
          className="inline-flex items-center justify-center rounded-2xl border border-[rgba(138,69,48,0.2)] bg-[rgba(138,69,48,0.08)] px-4 py-3 text-sm font-semibold text-[var(--color-muted)] hover:bg-[rgba(138,69,48,0.12)]"
          aria-label="Remover livro do dispositivo"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
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