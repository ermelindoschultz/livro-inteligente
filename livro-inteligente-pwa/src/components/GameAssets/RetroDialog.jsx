export default function RetroDialog({ message, tone = 'default' }) {
  const toneClasses =
    tone === 'warning'
      ? 'border-[rgba(138,69,48,0.28)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
      : tone === 'success'
        ? 'border-[rgba(35,92,59,0.24)] bg-[var(--color-success-soft)] text-[var(--color-success)]'
        : 'border-[var(--color-line)] bg-[rgba(255,255,255,0.86)] text-[var(--color-ink)]'

  return (
    <div className={`relative overflow-hidden rounded-[20px] border p-4 shadow-[0_12px_30px_rgba(47,36,25,0.08)] ${toneClasses}`}>
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-35" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M2 8V2H8M92 2H98V8M98 92V98H92M8 98H2V92" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
      <p className="relative text-sm leading-6">{message}</p>
    </div>
  )
}