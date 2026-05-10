import { useConnectivity } from '../hooks/useConnectivity.js'
import { useConnectionStatusModal } from '../context/ConnectionStatusModalContext.jsx'

export default function ConnectionStatusModal() {
  const { isOnline } = useConnectivity()
  const { isOpen, closeModal } = useConnectionStatusModal()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-96 rounded-[24px] border border-[var(--color-line)] bg-[var(--color-paper)] shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">Status da Conexão</h2>
          <button
            type="button"
            onClick={closeModal}
            className="text-[var(--color-muted)] hover:text-[var(--color-ink)] text-lg"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-[16px] bg-[rgba(255,255,255,0.5)] p-4">
            <div className={`h-4 w-4 rounded-full ${isOnline ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Conectividade
              </p>
              <p className="text-base font-semibold text-[var(--color-ink)]">
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-[16px] bg-[rgba(255,255,255,0.5)] p-4">
            <div className="h-4 w-4 rounded-full bg-[#f59e0b]" />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Dados
              </p>
              <p className="text-base font-semibold text-[var(--color-ink)]">
                Sincronizado
              </p>
            </div>
          </div>

          <p className="text-sm leading-6 text-[var(--color-muted)] pt-2">
            {isOnline
              ? 'Sua biblioteca está sincronizada. Novos livros serão baixados automaticamente quando disponíveis.'
              : 'Modo offline ativo. Apenas os livros guardados no dispositivo estão disponíveis. Conecte-se à internet para sincronizar.'}
          </p>
        </div>

        <button
          type="button"
          onClick={closeModal}
          className="w-full rounded-[14px] border border-[var(--color-line)] bg-[rgba(255,255,255,0.6)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[rgba(255,255,255,0.8)]"
        >
          Entendi
        </button>
      </div>
    </div>
  )
}
