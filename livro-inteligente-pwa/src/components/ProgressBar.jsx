export default function ProgressBar({ value, label = 'Preparando sua leitura' }) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-[var(--color-accent)] font-[var(--font-pixel)]">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-3 overflow-hidden border border-[var(--color-line)] bg-[rgba(255,255,255,0.04)]">
        <div
          className="h-full bg-[var(--color-accent)] transition-[width] duration-300"
          style={{ width: `${value}%`, imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  )
}