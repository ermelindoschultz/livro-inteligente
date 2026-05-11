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
import { useGlobalDialog } from '../../hooks/useGlobalDialog.js'
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
        className={`flex w-full items-center justify-between rounded-[18px] px-3 py-3 text-left text-sm transition ${isActive
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
  const { openDialog } = useGlobalDialog()
  const contentStartRef = useRef(null)
  const touchStartRef = useRef(null)
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
    refetchOnMount: 'always',
  })

  const book = bookQuery.data ?? null
  const metadata = book?.metadataSnapshot ?? null
  const {
    chapters,
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
  const effectiveView = view === 'intro' || view === 'boss' ? view : null
  const isSpecialView = effectiveView === 'intro' || effectiveView === 'boss'

  const chapterQuery = useQuery({
    queryKey: ['chapter-content', book?.id ?? null, currentChapter?.id ?? null],
    queryFn: () => getChapterContent(book, currentChapter),
    enabled: Boolean(book && currentChapter && effectiveView !== 'intro' && effectiveView !== 'boss'),
    staleTime: Infinity,
  })

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

  useEffect(() => {
    if (!contentStartRef.current) {
      return
    }

    contentStartRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentChapter?.id, effectiveView])

  if (!hasValidId) {
    return <ReaderNotFound reason="O identificador informado na rota nao e valido." />
  }

  if (bookQuery.isLoading || (bookQuery.isFetching && !book)) {
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

  const findChapter = (chapterId) => chapters.find((chapter) => chapter.id === chapterId) ?? null

  const goToReaderChapter = (chapterId, options = {}) => {
    const chapter = findChapter(chapterId)

    if (!chapter) {
      return
    }

    if (options.openIntro && chapter.type === 'chapter') {
      goToChapter(chapter.id, { view: 'intro' })
      return
    }

    goToChapter(chapter.id, options)
  }

  const handleChapterSelect = (chapterId) => {
    goToReaderChapter(chapterId, { openIntro: true })
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
    navigateToView(null, currentMainChapter.id)
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

  const showAiTools = isOnline && !isSpecialView && Boolean(currentChapterMarkdownUrl)

  const handleBackward = () => {
    if (effectiveView === 'boss') {
      handleRetreatFromBoss()
      return
    }

    if (effectiveView === 'intro') {
      if (hasPrevious && previousChapter) {
        goToReaderChapter(previousChapter.id, { openIntro: previousChapter.type === 'chapter' })
      }
      return
    }

    if (currentChapter?.type === 'chapter') {
      navigateToView('intro', currentChapter.id)
      return
    }

    if (hasPrevious) {
      goPrev()
    }
  }

  const handleForward = () => {
    if (effectiveView === 'intro') {
      void handleStartChallenge()
      return
    }

    if (effectiveView === 'boss') {
      return
    }

    if (isAtLastOfGroup) {
      handleOpenBoss()
      return
    }

    if (hasNext && nextChapter) {
      goToReaderChapter(nextChapter.id, { openIntro: nextChapter.type === 'chapter' })
    }
  }

  const handleTouchStart = (event) => {
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: coarse)').matches || event.touches.length !== 1) {
      touchStartRef.current = null
      return
    }

    const touch = event.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (event) => {
    if (!touchStartRef.current || isChapterMenuOpen || isAiMenuOpen) {
      touchStartRef.current = null
      return
    }

    const touch = event.changedTouches[0]

    if (!touch) {
      touchStartRef.current = null
      return
    }

    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    touchStartRef.current = null

    if (Math.abs(deltaX) < 72 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) {
      return
    }

    if (deltaX < 0) {
      handleForward()
      return
    }

    handleBackward()
  }

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

  const handleCopyChapterForAi = async () => {


    // Then copy in the background
    if (!currentChapterMarkdownUrl) {
      return
    }

    try {
      const response = await fetch(currentChapterMarkdownUrl, { cache: 'no-store' })

      if (!response.ok) {
        throw new Error(`Falha ao carregar o markdown (${response.status}).`)
      }

      const markdown = await response.text()
      await navigator.clipboard.writeText(markdown)

      openDialog('ai-instructions')

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel copiar o capitulo para IA.'
      publishAiFeedback(message, 'error')
    }
  }



  return (
    <section className="relative flex min-h-[calc(100svh-8.5rem)] flex-col overflow-visible border-2 border-[var(--color-line)] bg-[var(--color-paper)] shadow-[var(--shadow-card)]">
      <header className="sticky top-0 z-20 border-b-2 border-[var(--color-line)] bg-[#161620] px-3 py-2.5 sm:px-5">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[var(--color-line)] bg-transparent text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
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
              <button
                type="button"
                onClick={handleCopyChapterForAi}
                className="inline-flex h-10 items-center gap-2 border border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-accent)]"
                aria-label="Copiar capitulo para IA"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(173,92,40,0.12)]">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="hidden sm:inline">Use sua IA favorita</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setIsChapterMenuOpen((value) => !value)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[var(--color-line)] bg-transparent text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
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
                className={`mt-1 truncate text-[11px] ${aiFeedback.tone === 'error' ? 'text-[var(--color-danger)]' : 'text-[#0f766e]'
                  }`}
              >
                {aiFeedback.message}
              </p>
            ) : null}
          </div>

          <span className="shrink-0 pt-0.5">{Math.min(currentPosition + 1, totalChapters)} / {totalChapters || 0}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)]">
          <div className="h-full bg-[var(--color-accent)] transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
      </header>

      {isChapterMenuOpen ? (
        <aside className="absolute inset-x-3 top-[5rem] z-30 max-h-[min(76svh,38rem)] overflow-auto border-2 border-[var(--color-line)] bg-[#161620] p-3 shadow-[var(--shadow-card)] sm:inset-x-auto sm:right-5 sm:w-[28rem]">
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

      <div
        ref={contentStartRef}
        className="flex-1 px-2 py-2 sm:px-3 sm:py-3"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {chapterError ? (
          <div className="mb-4 rounded-[24px] border border-[rgba(138,69,48,0.18)] bg-[var(--color-danger-soft)] px-4 py-4 text-sm text-[var(--color-danger)]">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="leading-6">{chapterError}</p>
            </div>
          </div>
        ) : null}

        {effectiveView === 'intro' && currentMainChapter ? (
          <ChallengeIntroPage
            challenge={currentMainChapter}
            challengePages={currentChallengePages}
            bossMeta={bossMeta}
            onReveal={handleRevealChallenge}
            onStart={handleStartChallenge}
          />
        ) : null}

        {effectiveView === 'boss' && currentMainChapter ? (
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
              stylesheets={chapterQuery.data?.stylesheets ?? []}
            />

            <EnrichmentWidget
              key={currentChapter?.id ?? 'no-chapter'}
              bookId={book?.id ?? null}
              markdownUrl={currentChapterMarkdownUrl}
              metadata={metadata}
              currentChapterId={currentChapter?.id ?? null}
            />
          </>
        ) : null}
      </div>

      {!isSpecialView ? (
        <footer className="sticky bottom-0 z-20 border-t-2 border-[var(--color-line)] bg-[var(--color-paper-strong)] px-3 py-2.5 sm:px-5" style={{ backgroundColor: '#161620' }}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleBackward}
              disabled={effectiveView === 'boss' ? false : !hasPrevious}
              className="inline-flex min-w-0 items-center gap-2 border border-[var(--color-line)] bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-left text-sm font-semibold text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {effectiveView === 'boss'
                  ? 'Voltar ao capitulo'
                  : effectiveView === 'intro'
                    ? previousChapter?.title ?? 'Inicio do livro'
                    : currentChapter?.type === 'chapter'
                      ? 'Introducao do desafio'
                      : previousChapter?.title ?? 'Inicio do livro'}
              </span>
            </button>

            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-accent)] font-[var(--font-pixel)]">Progresso</p>
              <p className="mt-1 text-sm font-bold text-[var(--color-ink)]">{Math.min(currentPosition + 1, totalChapters)} de {totalChapters || 0}</p>
            </div>

            <button
              type="button"
              onClick={handleForward}
              disabled={effectiveView === 'boss' ? true : effectiveView === 'intro' ? false : isAtLastOfGroup ? false : !hasNext}
              className="inline-flex min-w-0 items-center justify-end gap-2 border border-[var(--color-line)] bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-right text-sm font-semibold text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="truncate">
                {effectiveView === 'intro'
                  ? 'Comecar leitura'
                  : isAtLastOfGroup
                    ? 'Desafio final'
                    : nextChapter?.type === 'chapter'
                      ? 'Introducao do desafio'
                      : nextChapter?.title ?? 'Fim do livro'}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </footer>
      ) : null}
    </section>
  )
}