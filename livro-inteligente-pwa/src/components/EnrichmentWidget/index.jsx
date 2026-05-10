import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react'
import { Sword } from 'pixelarticons/react/Sword'
import ConfirmDialog from '../ConfirmDialog.jsx'
import { useAiCoins } from '../../hooks/useAiCoins.js'
import { useConnectivity } from '../../hooks/useConnectivity.js'
import { useWidgetModal } from '../../context/WidgetModalContext.jsx'
import { addGeneratedTriviaToBook } from '../../services/db.js'
import { generateTriviaForChapter } from '../../services/generateTrivia.js'
import EnrichmentItem from './EnrichmentItem.jsx'

function collectEnrichmentItems(metadata, currentChapterId) {
  if (!currentChapterId || !Array.isArray(metadata?.chapters)) {
    return []
  }

  return metadata.chapters.flatMap((chapter) => {
    if (!Array.isArray(chapter?.enrichment)) {
      return []
    }

    return chapter.enrichment
      .filter((item) => item?.page_id === currentChapterId && item?.type === 'trivia')
      .map((item, index) => ({
        ...item,
        id: `${chapter.id}-${item.type}-${index}`,
        sourceChapterId: chapter.id,
        sourceChapterTitle: chapter.title,
      }))
  })
}

function resolveTrainingHostChapterId(metadata, currentChapterId, items) {
  if (items[0]?.sourceChapterId) {
    return items[0].sourceChapterId
  }

  if (!currentChapterId || !Array.isArray(metadata?.chapters)) {
    return null
  }

  const currentChapter = metadata.chapters.find((chapter) => chapter?.id === currentChapterId)

  if (!currentChapter) {
    return null
  }

  return currentChapter.parent_id ?? currentChapter.id
}

export default function EnrichmentWidget({ metadata, currentChapterId, bookId, markdownUrl }) {
  const { portalNode } = useWidgetModal()
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState(null)
  const pendingGeneratedQuestionRef = useRef(false)
  const previousItemsCountRef = useRef(0)
  const { isOnline } = useConnectivity()
  const { coins, consumeCoin, isLoading: isLoadingCoins } = useAiCoins(bookId)
  const items = collectEnrichmentItems(metadata, currentChapterId)
  const hostChapterId = useMemo(() => resolveTrainingHostChapterId(metadata, currentChapterId, items), [metadata, currentChapterId, items])
  const currentItem = items[currentIndex] ?? null
  const canGenerateOnline =
    isOnline &&
    Number.isInteger(bookId) &&
    bookId > 0 &&
    typeof markdownUrl === 'string' &&
    markdownUrl.length > 0 &&
    typeof hostChapterId === 'string' &&
    hostChapterId.length > 0
  const hasItems = items.length > 0
  const shouldRenderWidget = hasItems

  const existingQuestions = useMemo(
    () => items.map((item) => item?.content?.question).filter((question) => typeof question === 'string' && question.length > 0),
    [items],
  )

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setCurrentIndex(0)
    setGenerationError(null)
  }, [isOpen, currentChapterId])

  useEffect(() => {
    if (items.length === 0) {
      setCurrentIndex(0)
      previousItemsCountRef.current = 0
      return
    }

    if (pendingGeneratedQuestionRef.current && items.length > previousItemsCountRef.current) {
      setCurrentIndex(items.length - 1)
      pendingGeneratedQuestionRef.current = false
    } else if (currentIndex > items.length - 1) {
      setCurrentIndex(items.length - 1)
    }

    previousItemsCountRef.current = items.length
  }, [currentIndex, items.length])

  if (!shouldRenderWidget) {
    return null
  }

  const handleOpen = () => {
    setIsOpen(true)
    setGenerationError(null)
  }

  const handleClose = () => {
    setIsOpen(false)
    setIsConfirmOpen(false)
    setGenerationError(null)
  }

  const handleGenerateConfirmed = async () => {
    if (!canGenerateOnline) {
      return
    }

    setIsGenerating(true)
    setGenerationError(null)

    try {
      const generatedItem = await generateTriviaForChapter({
        bookId,
        markdownUrl,
        existingQuestions,
        pageId: currentChapterId,
        chapterId: hostChapterId,
      })

      await addGeneratedTriviaToBook(bookId, generatedItem.chapterId, generatedItem.page_id, generatedItem.content)
      await consumeCoin()
      pendingGeneratedQuestionRef.current = true
      setIsConfirmOpen(false)
    } catch (error) {
      const baseMessage = error instanceof Error ? error.message : 'Nao foi possivel gerar uma nova pergunta agora.'
      setGenerationError(`${baseMessage} Nenhuma moeda foi utilizada.`)
    } finally {
      setIsGenerating(false)
    }
  }

  const modalContent = isOpen ? (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <section className="flex max-h-[min(84svh,46rem)] w-full max-w-[42rem] flex-col overflow-hidden rounded-[28px] border border-[var(--color-line)] bg-[rgba(255,250,241,0.98)] shadow-[0_30px_90px_rgba(47,36,25,0.22)] backdrop-blur-md">
          <header className="flex items-start justify-between gap-4 border-b border-[var(--color-line)] px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Treinamento</p>
              <h2 className="text-base font-semibold text-[var(--color-ink)]">Pratique esta pagina</h2>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {hasItems ? `${currentIndex + 1} / ${items.length}` : 'Nenhuma pergunta salva para esta pagina ainda.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] bg-white/80 text-[var(--color-ink)]"
              aria-label="Fechar treinamento"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] px-5 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
              disabled={!hasItems || currentIndex === 0}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] bg-white/80 text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Pergunta anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="text-center text-xs text-[var(--color-muted)]">
              <p className="font-semibold uppercase tracking-[0.22em]">Questoes</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{hasItems ? `${currentIndex + 1} de ${items.length}` : 'Sem perguntas'}</p>
            </div>

            <button
              type="button"
              onClick={() => setCurrentIndex((value) => Math.min(items.length - 1, value + 1))}
              disabled={!hasItems || currentIndex >= items.length - 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] bg-white/80 text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Proxima pergunta"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {currentItem ? (
              <EnrichmentItem key={currentItem.id} item={currentItem} />
            ) : (
              <div className="rounded-[24px] border border-dashed border-[var(--color-line)] bg-[rgba(255,255,255,0.68)] p-6 text-center">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Nenhuma pergunta salva ainda</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  Gere uma nova pergunta online para adicionar treinamento a esta pagina.
                </p>
              </div>
            )}

            {generationError ? (
              <div className="mt-4 rounded-[18px] border border-[rgba(138,69,48,0.24)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
                {generationError}
              </div>
            ) : null}
          </div>

          <footer className="flex flex-col gap-3 border-t border-[var(--color-line)] px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3 text-xs text-[var(--color-muted)]">
              <span>{canGenerateOnline ? 'Geracao online disponivel para este capitulo.' : 'Geracao online indisponivel no momento.'}</span>
              <span className="shrink-0 font-semibold text-[var(--color-ink)]">
                {isLoadingCoins ? '...' : `${coins ?? 0} moeda${coins === 1 ? '' : 's'}`}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={!canGenerateOnline || isLoadingCoins || isGenerating || (coins ?? 0) <= 0}
              className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-transparent bg-[var(--color-ink)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(47,36,25,0.92)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Sparkles className="h-4 w-4" />
              <span>Gerar nova pergunta</span>
            </button>
          </footer>
        </section>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Gerar nova pergunta"
        description={`Esta acao consome 1 moeda deste livro. ${coins ?? 0} moeda${coins === 1 ? '' : 's'} disponivel${coins === 1 ? '' : 'eis'} agora.`}
        confirmLabel="Gerar pergunta"
        cancelLabel="Cancelar"
        isLoading={isGenerating}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleGenerateConfirmed}
      />
    </>
  ) : null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-50 flex justify-end px-4 sm:px-5 sm:bottom-[calc(env(safe-area-inset-bottom)+7rem)]">
      <div className="pointer-events-auto flex w-full max-w-[28rem] flex-col items-end gap-3">
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex h-14 items-center gap-3 rounded-full border border-[rgba(195,122,74,0.22)] bg-[var(--color-accent)] px-5 text-sm font-semibold text-white shadow-[0_22px_50px_rgba(173,92,40,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_55px_rgba(173,92,40,0.4)]"
          aria-expanded={isOpen}
          aria-label="Abrir treinamento"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/16">
            <Sword width={16} height={16} />
          </span>
          <span>Treinar</span>
        </button>
      </div>
      {portalNode && modalContent ? createPortal(modalContent, portalNode) : null}
    </div>
  )
}