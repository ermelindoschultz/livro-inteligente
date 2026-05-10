export default function ProgressBar({ value, label = 'Preparando sua leitura' }) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[rgba(47,36,25,0.08)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-300"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}