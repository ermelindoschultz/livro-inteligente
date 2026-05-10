import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, LoaderCircle, Menu, Sparkles, TriangleAlert } from 'lucide-react'
import { Crown } from 'pixelarticons/react/Crown'
import { Lock } from 'pixelarticons/react/Lock'
import { Sword } from 'pixelarticons/react/Sword'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import BookViewer from '../../components/BookViewer/index.jsx'
import EnrichmentWidget from '../../components/EnrichmentWidget/index.jsx'
import { useConnectivity } from '../../hooks/useConnectivity.js'
import { useGameProgress } from '../../hooks/useGameProgress.js'
import { useGameReader } from '../../hooks/useGameReader.js'
import { resolvePublicBookUrl } from '../../services/api.js'
import { getChapterContent } from '../../services/bookDownload.js'
import { BOOKS_CHANGED_EVENT, getStoredBookById } from '../../services/db.js'
import BossFightPage from './BossFightPage.jsx'
import ChallengeIntroPage from './ChallengeIntroPage.jsx'

function resolveChapterMarkdownUrl(book, chapter) {
  if (!chapter?.markdown_path) {
    return null
  }

  const publicBookUrl = resolvePublicBookUrl(book)

  if (!publicBookUrl) {
    return null
  }

  try {
    return new URL(chapter.markdown_path, publicBookUrl).toString()
  } catch {
    return null
  }
}

function ReaderNotFound({ reason }) {
  return (
    <section className="rounded-[28px] border border-dashed border-[var(--color-line)] bg-[rgba(255,251,244,0.6)] p-8 shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Leitor</p>
      <h1 className="font-display mt-4 text-3xl text-[var(--color-ink)]">Livro indisponivel offline</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{reason}</p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[rgba(255,255,255,0.62)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para a estante
      </Link>
    </section>
  )
}

function ChapterStatusIcon({ item, progressMap }) {
  if (item?.type !== 'chapter') {
    return null
  }

  const progress = progressMap?.[item.id]

  if (progress?.bossDefeated) {
    return <Crown width={16} height={16} className="text-[var(--color-accent)]" />
  }

  if (progress?.introSeen) {
    return <Sword width={16} height={16} className="text-[var(--color-accent)]" />
  }

  return <Lock width={16} height={16} className="text-[var(--color-muted)]" />
}

function ChapterTreeItem({ item, currentChapterId, onSelect, progressMap, level = 0 }) {
  const isActive = item.id === currentChapterId

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(item.id)}
        className={`flex w-full items-center justify-between rounded-[18px] px-3 py-3 text-left text-sm transition ${
          isActive
            ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
            : 'text-[var(--color-ink)] hover:bg-[rgba(47,36,25,0.05)]'
        }`}
        style={{ paddingLeft: `${level * 18 + 12}px` }}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          <ChapterStatusIcon item={item} progressMap={progressMap} />
          <span className="min-w-0 truncate">{item.label}</span>
        </span>
        <span className="ml-3 shrink-0 text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)]">{item.order}</span>
      </button>

      {Array.isArray(item.children) && item.children.length > 0 ? (
        <div className="mt-1 space-y-1">
          {item.children.map((child) => (
            <ChapterTreeItem
              key={child.id}
              item={child}
              currentChapterId={currentChapterId}
              onSelect={onSelect}
              progressMap={progressMap}
              level={level + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function ReaderPage() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { isOnline } = useConnectivity()
  const [isChapterMenuOpen, setIsChapterMenuOpen] = useState(false)
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false)
  const [aiFeedback, setAiFeedback] = useState(null)
  const aiFeedbackTimeoutRef = useRef(null)
  const numericBookId = Number(id)
  const hasValidId = Number.isInteger(numericBookId) && numericBookId > 0
  const view = searchParams.get('view')

  useEffect(() => {
    const handleBooksChanged = () => {
      if (hasValidId) {
        queryClient.invalidateQueries({ queryKey: ['stored-book', numericBookId] })
      }
    }

    window.addEventListener(BOOKS_CHANGED_EVENT, handleBooksChanged)
    return () => {
      window.removeEventListener(BOOKS_CHANGED_EVENT, handleBooksChanged)
    }
  }, [hasValidId, numericBookId, queryClient])

  const bookQuery = useQuery({
    queryKey: ['stored-book', numericBookId],
    queryFn: () => getStoredBookById(numericBookId),
    enabled: hasValidId,
    staleTime: 5_000,
  })

  const book = bookQuery.data ?? null
  const metadata = book?.metadataSnapshot ?? null
  const {
    chapterTree,
    currentChapter,
    currentPosition,
    goNext,
    goPrev,
    goToChapter,
    hasNext,
    hasPrevious,
    nextChapter,
    previousChapter,
    progressPercent,
    totalChapters,
    currentMainChapter,
    currentChallengePages,
    firstChallengePage,
    lastChallengePage,
    nextMainChapter,
    isAtLastOfGroup,
    getBossMeta,
    getBossQuestions,
  } = useGameReader({ book: book ?? {}, metadata })
  const { progressMap, markIntroSeen, saveBossProgress, markBossDefeated } = useGameProgress(book?.id)
  const currentChallengeProgress = currentMainChapter ? progressMap[currentMainChapter.id] : null
  const bossMeta = getBossMeta(currentMainChapter?.id)
  const bossQuestions = getBossQuestions(currentMainChapter?.id)
  const currentChapterMarkdownUrl = useMemo(() => resolveChapterMarkdownUrl(book, currentChapter), [book, currentChapter])

  const chapterQuery = useQuery({
    queryKey: ['chapter-content', book?.id ?? null, currentChapter?.id ?? null],
    queryFn: () => getChapterContent(book, currentChapter),
    enabled: Boolean(book && currentChapter && view !== 'intro' && view !== 'boss'),
    staleTime: Infinity,
  })

  useEffect(() => {
    if (!currentMainChapter || currentChapter?.type !== 'chapter' || view || currentChallengeProgress?.introSeen) {
      return
    }

    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('chapter', currentMainChapter.id)
    nextParams.set('view', 'intro')
    setSearchParams(nextParams, { replace: true })
  }, [currentChapter?.type, currentMainChapter, currentChallengeProgress?.introSeen, searchParams, setSearchParams, view])

  useEffect(() => {
    return () => {
      if (aiFeedbackTimeoutRef.current) {
        window.clearTimeout(aiFeedbackTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isOnline) {
      setIsAiMenuOpen(false)
    }
  }, [isOnline])

  if (!hasValidId) {
    return <ReaderNotFound reason="O identificador informado na rota nao e valido." />
  }

  if (bookQuery.isLoading) {
    return (
      <section className="rounded-[28px] border border-[var(--color-line)] bg-[var(--color-paper)] p-6 shadow-[var(--shadow-card)]">
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Carregando livro
        </div>
      </section>
    )
  }

  if (!book || !book.isDownloaded) {
    return (
      <ReaderNotFound reason="Este livro ainda nao foi baixado neste dispositivo, entao a rota nao consegue montar o leitor offline." />
    )
  }

  const chapterError =
    !currentChapter
      ? 'Nenhum capitulo foi encontrado neste livro.'
      : chapterQuery.error instanceof Error
        ? chapterQuery.error.message
        : null

  const handleChapterSelect = (chapterId) => {
    goToChapter(chapterId)
    setIsChapterMenuOpen(false)
    queryClient.invalidateQueries({ queryKey: ['stored-book', numericBookId] })
  }

  const navigateToView = (nextView, chapterId, options = {}) => {
    const nextParams = new URLSearchParams(searchParams)

    if (chapterId) {
      nextParams.set('chapter', chapterId)
    }

    if (nextView) {
      nextParams.set('view', nextView)
    } else {
      nextParams.delete('view')
    }

    setSearchParams(nextParams, options)
  }

  const handleRevealChallenge = async () => {
    if (!currentMainChapter) {
      return
    }

    await markIntroSeen(currentMainChapter.id)
  }

  const handleStartChallenge = async () => {
    if (!currentMainChapter) {
      return
    }

    await markIntroSeen(currentMainChapter.id)
    navigateToView(null, firstChallengePage?.id ?? currentMainChapter.id)
  }

  const handleOpenBoss = () => {
    if (!currentMainChapter) {
      return
    }

    navigateToView('boss', currentMainChapter.id)
  }

  const handleRetreatFromBoss = () => {
    navigateToView(null, lastChallengePage?.id ?? currentMainChapter?.id ?? currentChapter?.id)
  }

  const handleSaveBossProgress = async (bossCorrectCount) => {
    if (!currentMainChapter) {
      return
    }

    await saveBossProgress(currentMainChapter.id, bossCorrectCount)
  }

  const handleFinishBoss = async () => {
    if (!currentMainChapter) {
      return
    }

    await markBossDefeated(currentMainChapter.id)

    if (nextMainChapter) {
      navigateToView('intro', nextMainChapter.id)
      return
    }

    navigateToView(null, lastChallengePage?.id ?? currentMainChapter.id)
  }

  const isSpecialView = view === 'intro' || view === 'boss'

  const showAiTools = isOnline && !isSpecialView && Boolean(currentChapterMarkdownUrl)

  const publishAiFeedback = (message, tone = 'default') => {
    if (aiFeedbackTimeoutRef.current) {
      window.clearTimeout(aiFeedbackTimeoutRef.current)
    }

    setAiFeedback({ message, tone })
    aiFeedbackTimeoutRef.current = window.setTimeout(() => {
      setAiFeedback(null)
      aiFeedbackTimeoutRef.current = null
    }, 2800)
  }

  const handleOpenChapterMarkdown = () => {
    if (!currentChapterMarkdownUrl) {
      publishAiFeedback('Este capitulo nao possui markdown para IA.', 'error')
      return
    }

    window.open(currentChapterMarkdownUrl, '_blank', 'noopener,noreferrer')
    setIsAiMenuOpen(false)
  }

  const handleCopyChapterForAi = async () => {
    if (!currentChapterMarkdownUrl) {
      publishAiFeedback('Este capitulo nao possui markdown para IA.', 'error')
      return
    }

    try {
      const response = await fetch(currentChapterMarkdownUrl, { cache: 'no-store' })

      if (!response.ok) {
        throw new Error(`Falha ao carregar o markdown (${response.status}).`)
      }

      const markdown = await response.text()
      await navigator.clipboard.writeText(markdown)
      publishAiFeedback('Capitulo copiado para a area de transferencia.', 'success')
      setIsAiMenuOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel copiar o capitulo para IA.'
      publishAiFeedback(message, 'error')
    }
  }

  return (
    <section className="relative flex min-h-[calc(100svh-8.5rem)] flex-col overflow-visible rounded-[28px] border border-[var(--color-line)] bg-[rgba(255,251,244,0.9)] shadow-[var(--shadow-card)] backdrop-blur-md">
      <header className="sticky top-0 z-20 border-b border-[var(--color-line)] bg-[rgba(255,250,241,0.96)] px-3 py-2.5 backdrop-blur-md sm:px-5">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] bg-white/80 text-[var(--color-ink)]"
            aria-label="Voltar para a estante"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Leitura offline</p>
            <h1 className="truncate text-lg font-semibold text-[var(--color-ink)]">{book.title}</h1>
          </div>

          <div className="relative flex shrink-0 items-center gap-2">
            {showAiTools ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAiMenuOpen((value) => !value)}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/80 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]"
                  aria-expanded={isAiMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Abrir ferramentas de IA"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(173,92,40,0.12)]">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <span className="hidden sm:inline">Texto para IA</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isAiMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAiMenuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+0.45rem)] z-30 min-w-[16rem] overflow-hidden rounded-[18px] border border-[var(--color-line)] bg-[rgba(255,250,241,0.98)] p-1.5 shadow-[0_18px_40px_rgba(47,36,25,0.16)]">
                    <button
                      type="button"
                      onClick={handleOpenChapterMarkdown}
                      className="flex w-full rounded-[14px] px-3 py-2 text-left text-sm font-medium text-[var(--color-ink)] transition hover:bg-[rgba(47,36,25,0.05)]"
                      role="menuitem"
                    >
                      Ver markdown
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyChapterForAi}
                      className="flex w-full rounded-[14px] px-3 py-2 text-left text-sm font-medium text-[var(--color-ink)] transition hover:bg-[rgba(47,36,25,0.05)]"
                      role="menuitem"
                    >
                      Copiar capitulo para IA
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setIsChapterMenuOpen((value) => !value)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] bg-white/80 text-[var(--color-ink)]"
              aria-expanded={isChapterMenuOpen}
              aria-label="Abrir sumario"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-start justify-between gap-3 text-xs text-[var(--color-muted)]">
          <div className="min-w-0 flex-1">
            <span className="block truncate">{currentChapter?.title ?? 'Capitulo indisponivel'}</span>

            {aiFeedback ? (
              <p
                className={`mt-1 truncate text-[11px] ${
                  aiFeedback.tone === 'error' ? 'text-[var(--color-danger)]' : 'text-[#0f766e]'
                }`}
              >
                {aiFeedback.message}
              </p>
            ) : null}
          </div>

          <span className="shrink-0 pt-0.5">{Math.min(currentPosition + 1, totalChapters)} / {totalChapters || 0}</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-[rgba(47,36,25,0.08)]">
          <div className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
      </header>

      {isChapterMenuOpen ? (
        <aside className="absolute inset-x-3 top-[5rem] z-30 max-h-[min(76svh,38rem)] overflow-auto rounded-[24px] border border-[var(--color-line)] bg-[rgba(255,250,241,0.98)] p-3 shadow-[0_24px_60px_rgba(47,36,25,0.18)] sm:inset-x-auto sm:right-5 sm:w-[28rem]">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Paginas do livro</p>
          <nav className="space-y-1">
            {chapterTree.map((item) => (
              <ChapterTreeItem
                key={item.id}
                item={item}
                currentChapterId={currentChapter?.id}
                onSelect={handleChapterSelect}
                progressMap={progressMap}
              />
            ))}
          </nav>
        </aside>
      ) : null}

      <div className="flex-1 px-2 py-2 sm:px-3 sm:py-3">
        {chapterError ? (
          <div className="mb-4 rounded-[24px] border border-[rgba(138,69,48,0.18)] bg-[var(--color-danger-soft)] px-4 py-4 text-sm text-[var(--color-danger)]">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="leading-6">{chapterError}</p>
            </div>
          </div>
        ) : null}

        {view === 'intro' && currentMainChapter ? (
          <ChallengeIntroPage
            challenge={currentMainChapter}
            challengePages={currentChallengePages}
            bossMeta={bossMeta}
            onReveal={handleRevealChallenge}
            onStart={handleStartChallenge}
          />
        ) : null}

        {view === 'boss' && currentMainChapter ? (
          <BossFightPage
            challenge={currentMainChapter}
            bossMeta={bossMeta}
            questions={bossQuestions}
            progress={currentChallengeProgress}
            onRetreat={handleRetreatFromBoss}
            onSaveBossProgress={handleSaveBossProgress}
            onFinishBoss={handleFinishBoss}
          />
        ) : null}

        {!isSpecialView ? (
          <>
            <BookViewer
              bodyHtml={chapterQuery.data?.bodyHtml ?? ''}
              chapterTitle={currentChapter?.title ?? ''}
              isLoading={chapterQuery.isLoading || chapterQuery.isFetching}
              stylesheetUrls={chapterQuery.data?.stylesheetUrls ?? []}
            />

            <EnrichmentWidget
              key={currentChapter?.id ?? 'no-chapter'}
              metadata={metadata}
              currentChapterId={currentChapter?.id ?? null}
            />
          </>
        ) : null}
      </div>

      {!isSpecialView ? (
        <footer className="sticky bottom-0 z-20 border-t border-[var(--color-line)] bg-[rgba(255,250,241,0.96)] px-3 py-2.5 backdrop-blur-md sm:px-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={!hasPrevious}
            className="inline-flex min-w-0 items-center gap-2 rounded-[18px] border border-[var(--color-line)] bg-white/80 px-3 py-2.5 text-left text-sm font-semibold text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">{previousChapter?.title ?? 'Inicio do livro'}</span>
          </button>

          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Progresso</p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{Math.min(currentPosition + 1, totalChapters)} de {totalChapters || 0}</p>
          </div>

          <button
            type="button"
            onClick={isAtLastOfGroup ? handleOpenBoss : goNext}
            disabled={isAtLastOfGroup ? false : !hasNext}
            className="inline-flex min-w-0 items-center justify-end gap-2 rounded-[18px] border border-[var(--color-line)] bg-white/80 px-3 py-2.5 text-right text-sm font-semibold text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <span className="truncate">{isAtLastOfGroup ? 'Desafio final' : nextChapter?.title ?? 'Fim do livro'}</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </button>
        </div>
        </footer>
      ) : null}
    </section>
  )
}