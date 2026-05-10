import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import EnrichmentPanel from './EnrichmentPanel.jsx'

function collectEnrichmentItems(metadata, currentChapterId) {
  if (!currentChapterId || !Array.isArray(metadata?.chapters)) {
    return []
  }

  return metadata.chapters.flatMap((chapter) => {
    if (!Array.isArray(chapter?.enrichment)) {
      return []
    }

    return chapter.enrichment
      .filter((item) => item?.page_id === currentChapterId)
      .map((item, index) => ({
        ...item,
        id: `${chapter.id}-${item.type}-${index}`,
        sourceChapterId: chapter.id,
        sourceChapterTitle: chapter.title,
      }))
  })
}

export default function EnrichmentWidget({ metadata, currentChapterId }) {
  const [isOpen, setIsOpen] = useState(false)
  const items = collectEnrichmentItems(metadata, currentChapterId)

  if (items.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-50 flex justify-end px-4 sm:px-5 sm:bottom-[calc(env(safe-area-inset-bottom)+7rem)]">
      <div className="pointer-events-auto flex w-full max-w-[28rem] flex-col items-end gap-3">
        <div
          className={`w-full origin-bottom transition-all duration-300 ${
            isOpen ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-4 scale-95 opacity-0'
          }`}
          aria-hidden={!isOpen}
        >
          <section className="max-h-[min(55svh,34rem)] overflow-hidden rounded-[28px] border border-[var(--color-line)] bg-[rgba(255,250,241,0.96)] p-3 shadow-[0_30px_90px_rgba(47,36,25,0.22)] backdrop-blur-md">
            <header className="mb-3 flex items-center justify-between gap-3 px-1">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Enrichment</p>
                <h2 className="text-base font-semibold text-[var(--color-ink)]">Conteudo extra desta pagina</h2>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] bg-white/80 text-[var(--color-ink)]"
                aria-label="Fechar conteudo extra"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="max-h-[calc(min(55svh,34rem)-4.5rem)] overflow-y-auto pr-1">
              <EnrichmentPanel items={items} />
            </div>
          </section>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="inline-flex h-14 items-center gap-3 rounded-full border border-[rgba(195,122,74,0.22)] bg-[var(--color-accent)] px-5 text-sm font-semibold text-white shadow-[0_22px_50px_rgba(173,92,40,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_55px_rgba(173,92,40,0.4)]"
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Fechar conteudo extra' : 'Abrir conteudo extra'}
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/16">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>{isOpen ? 'Fechar extras' : `Ver extras (${items.length})`}</span>
        </button>
      </div>
    </div>
  )
}