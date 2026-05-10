export default function AiInstructionsDialog(props) {
  const safeProps = props || {}
  const onClose = typeof safeProps.onClose === 'function' ? safeProps.onClose : () => {}
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">Capitulo Copiado!</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-[var(--color-muted)] hover:text-[var(--color-ink)] text-lg"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-[var(--color-ink)] leading-6">
          O capítulo foi copiado para sua área de transferência.
        </p>

        <div className="rounded-[16px] bg-[rgba(255,255,255,0.5)] p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Como usar:
          </p>
          <ol className="text-sm text-[var(--color-ink)] space-y-2 list-decimal list-inside">
            <li>Acesse sua plataforma de IA favorita (ChatGPT, Claude, Gemini, etc.)</li>
            <li>Cole o conteúdo na caixa de conversa</li>
            <li>Peça resumos, explicações, perguntas ou qualquer análise desejada</li>
          </ol>
        </div>

        <p className="text-xs text-[var(--color-muted)]">
          💡 Dica: Use prompts específicos para obter melhores respostas da IA!
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-[14px] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition"
      >
        Entendi!
      </button>
    </div>
  )
}
