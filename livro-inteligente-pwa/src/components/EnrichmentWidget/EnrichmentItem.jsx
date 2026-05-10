import { getEnrichmentDefinition } from './registry.js'

export default function EnrichmentItem({ item }) {
  const definition = getEnrichmentDefinition(item?.type)

  if (!definition) {
    return null
  }

  const WidgetComponent = definition.component
  const Icon = definition.icon

  return (
    <article className="rounded-[24px] border border-[var(--color-line)] bg-[rgba(255,255,255,0.82)] p-4 shadow-[0_18px_45px_rgba(47,36,25,0.08)]">
      <header className="mb-3 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">{definition.label}</h3>
          {item.sourceChapterTitle ? <p className="text-xs text-[var(--color-muted)]">{item.sourceChapterTitle}</p> : null}
        </div>
      </header>

      <WidgetComponent content={item.content} item={item} />
    </article>
  )
}