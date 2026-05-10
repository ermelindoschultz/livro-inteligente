import { X } from 'lucide-react'

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-[28px] border border-[var(--color-line)] bg-[var(--color-paper)] shadow-[var(--shadow-card)] backdrop-blur-md">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[var(--color-line)] px-6 py-5">
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h2>
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-muted)] hover:bg-[rgba(255,255,255,0.6)] disabled:opacity-50"
              aria-label="Fechar diálogo"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            <p className="text-sm leading-6 text-[var(--color-muted)]">{description}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-[var(--color-line)] px-6 py-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 rounded-2xl border border-[var(--color-line)] bg-[rgba(255,255,255,0.6)] px-4 py-3 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[rgba(255,255,255,0.8)] disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-all ${
                isDangerous
                  ? 'border border-transparent bg-[var(--color-danger)] hover:bg-[rgba(138,69,48,0.9)] disabled:opacity-50'
                  : 'border border-transparent bg-[var(--color-ink)] hover:bg-[rgba(47,36,25,0.9)] disabled:opacity-50'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Processando...</span>
                </div>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
