import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { updateBookRecord } from '../services/db.js'

function findChapterIndex(chapters, chapterId) {
  if (!chapterId) {
    return -1
  }

  return chapters.findIndex((chapter) => chapter.id === chapterId)
}

function getOrderedChapters(metadata) {
  if (!Array.isArray(metadata?.chapters)) {
    return []
  }

  return [...metadata.chapters].sort((left, right) => (left.position ?? 0) - (right.position ?? 0))
}

export function useReader({ book, metadata }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const chapters = getOrderedChapters(metadata)
  const chapterTree = Array.isArray(metadata?.navigation_tree) ? metadata.navigation_tree : chapters
  const requestedChapterId = searchParams.get('chapter')
  const requestedIndex = findChapterIndex(chapters, requestedChapterId)
  const lastReadIndex = findChapterIndex(chapters, book?.lastReadChapterId)
  const currentPosition = requestedIndex >= 0 ? requestedIndex : lastReadIndex >= 0 ? lastReadIndex : 0
  const currentChapter = chapters[currentPosition] ?? null
  const previousChapter = currentPosition > 0 ? chapters[currentPosition - 1] : null
  const nextChapter = currentPosition < chapters.length - 1 ? chapters[currentPosition + 1] : null
  const totalChapters = chapters.length
  const progressPercent = totalChapters === 0 ? 0 : Math.round(((currentPosition + 1) / totalChapters) * 100)

  useEffect(() => {
    if (!currentChapter) {
      return
    }

    if (requestedChapterId !== currentChapter.id) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('chapter', currentChapter.id)
      setSearchParams(nextParams, { replace: true })
    }
  }, [currentChapter, requestedChapterId, searchParams, setSearchParams])

  const goToChapter = (chapterId, options = {}) => {
    const nextIndex = findChapterIndex(chapters, chapterId)

    if (nextIndex < 0) {
      return
    }

    const nextChapter = chapters[nextIndex]
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('chapter', nextChapter.id)

    if (!options.preserveView) {
      nextParams.delete('view')
    }

    setSearchParams(nextParams)
    void updateBookRecord(book.id, { lastReadChapterId: nextChapter.id })
  }

  const goPrev = () => {
    if (previousChapter) {
      goToChapter(previousChapter.id)
    }
  }

  const goNext = () => {
    if (nextChapter) {
      goToChapter(nextChapter.id)
    }
  }

  return {
    chapterTree,
    chapters,
    currentChapter,
    currentPosition,
    goNext,
    goPrev,
    goToChapter,
    hasNext: Boolean(nextChapter),
    hasPrevious: Boolean(previousChapter),
    nextChapter,
    previousChapter,
    progressPercent,
    totalChapters,
  }
}
