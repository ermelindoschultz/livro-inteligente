import { Check, Cloud, Delete, Download, Loader, WarningDiamond } from 'pixelarticons/react'

const pixelStyle = { imageRendering: 'pixelated' }

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
        className="inline-flex w-full items-center justify-center gap-2 border-2 border-[var(--color-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--color-muted)] font-[var(--font-pixel)]"
      >
        <WarningDiamond className="h-4 w-4" style={pixelStyle} />
        Indisponivel
      </button>
    )
  }

  if (state.status === 'pending') {
    return (
      <button
        type="button"
        disabled
        className="inline-flex w-full items-center justify-center gap-2 border-2 border-[var(--color-accent)] bg-[rgba(232,168,32,0.12)] px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--color-accent)] font-[var(--font-pixel)]"
      >
        <Loader className="h-4 w-4 animate-spin" style={pixelStyle} />
        {state.progress}% salvo offline
      </button>
    )
  }

  if (book.isDownloaded || state.status === 'completed') {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onOpen(book)}
          disabled={openingBookId === book.id}
          className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-[var(--color-success)] bg-[var(--color-success-soft)] px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--color-success)] font-[var(--font-pixel)] hover:bg-[rgba(80,200,120,0.22)] disabled:opacity-60"
        >
          {openingBookId === book.id ? (
            <Loader className="h-4 w-4 animate-spin" style={pixelStyle} />
          ) : (
            <Check className="h-4 w-4" style={pixelStyle} />
          )}
          {openingBookId === book.id ? 'Abrindo...' : '▶ Abrir'}
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(book)}
          className="inline-flex items-center justify-center border-2 border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-4 py-3 text-[var(--color-danger)] hover:bg-[rgba(232,64,64,0.22)]"
          aria-label="Remover livro do dispositivo"
        >
          <Delete className="h-4 w-4" style={pixelStyle} />
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onDownload(book)}
      className="inline-flex w-full items-center justify-center gap-2 border-2 border-[var(--color-accent)] bg-[rgba(232,168,32,0.1)] px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--color-accent)] font-[var(--font-pixel)] hover:bg-[rgba(232,168,32,0.2)]"
    >
      <Download className="h-4 w-4" style={pixelStyle} />
      Baixar offline
    </button>
  )
}