export default function RetroDialog({ message, tone = 'default' }) {
  const toneClasses =
    tone === 'warning'
      ? 'border-[rgba(138,69,48,0.28)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
      : tone === 'success'
        ? 'border-[rgba(35,92,59,0.24)] bg-[var(--color-success-soft)] text-[var(--color-success)]'
        : 'border-[var(--color-line)] bg-[var(--color-paper-strong)] text-[var(--color-ink)]'

  return (
    <div className={`relative overflow-hidden border-2 p-4 ${toneClasses}`}>
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-35" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M2 8V2H8M92 2H98V8M98 92V98H92M8 98H2V92" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
      <p className="relative text-sm leading-6">{message}</p>
    </div>
  )
}