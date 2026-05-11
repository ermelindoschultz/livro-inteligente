import { startTransition, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiBaseUrl, ApiConfigurationError, fetchBooksWithOfflineSupport } from '../services/api.js'
import {
  BOOKS_CHANGED_EVENT,
  ensureBookRecord,
  listStoredBooks,
  syncRemoteBooks,
} from '../services/db.js'
import { downloadBook, removeBook } from '../services/bookDownload.js'
import { useConnectivity } from './useConnectivity.js'
import { useConfirmDialog } from './useConfirmDialog.js'

function sortBooks(left, right) {
  if (left.isDownloaded !== right.isDownloaded) {
    return Number(right.isDownloaded) - Number(left.isDownloaded)
  }

  return left.title.localeCompare(right.title, 'pt-BR', {
    sensitivity: 'base',
    numeric: true,
  })
}

const BOOKS_PER_PAGE = 12

export function useBookDownload() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { isOnline, probeReady } = useConnectivity()
  const [downloadStates, setDownloadStates] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const deleteDialog = useConfirmDialog()

  useEffect(() => {
    const handleBooksChanged = () => {
      queryClient.invalidateQueries({ queryKey: ['stored-books'] })
    }

    window.addEventListener(BOOKS_CHANGED_EVENT, handleBooksChanged)
    return () => {
      window.removeEventListener(BOOKS_CHANGED_EVENT, handleBooksChanged)
    }
  }, [queryClient])

  const storedBooksQuery = useQuery({
    queryKey: ['stored-books'],
    queryFn: listStoredBooks,
    placeholderData: [],
    staleTime: 5_000,
  })

  const syncBooksQuery = useQuery({
    queryKey: ['books-sync', apiBaseUrl],
    queryFn: async () => {
      const { books, source } = await fetchBooksWithOfflineSupport({ page: 1, limit: 1000 })
      if (source === 'api') {
        await syncRemoteBooks(books)
      }
      return { books, source }
    },
    enabled: probeReady && isOnline,
    retry: 1,
  })

  useEffect(() => {
    if (!syncBooksQuery.data) {
      return
    }

    // Invalidate stored books query when we get fresh data from API
    // Or when we switch between online/offline modes
    if (syncBooksQuery.data.source === 'api' || isOnline) {
      queryClient.invalidateQueries({ queryKey: ['stored-books'] })
    }
  }, [syncBooksQuery.data, queryClient, isOnline])

  const books = [...(storedBooksQuery.data ?? [])].sort(sortBooks)
  const visibleBooks = isOnline ? books : books.filter((book) => book.isDownloaded)
  const downloadedCount = books.filter((book) => book.isDownloaded).length
  const totalPages = Math.max(1, Math.ceil(visibleBooks.length / BOOKS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedBooks = visibleBooks.slice((safePage - 1) * BOOKS_PER_PAGE, safePage * BOOKS_PER_PAGE)
  const hasApiConfig = Boolean(apiBaseUrl)
  const syncError = syncBooksQuery.error
  const isUsingCache = syncBooksQuery.data?.source === 'cache'

  const syncErrorMessage = syncError && !isUsingCache
    ? syncError instanceof ApiConfigurationError
      ? 'Sua biblioteca ainda nao esta pronta para sincronizar.'
      : 'Nao foi possivel atualizar a estante agora. Tente novamente em instantes.'
    : null

  const openingBookId = null

  const handleDownload = async (book) => {
    try {
      await ensureBookRecord(book)
      startTransition(() => {
        setDownloadStates((current) => ({
          ...current,
          [book.id]: { status: 'pending', progress: 0, error: null },
        }))
      })

      await downloadBook(book, {
        onProgress: ({ percent }) => {
          startTransition(() => {
            setDownloadStates((current) => ({
              ...current,
              [book.id]: { status: 'pending', progress: percent, error: null },
            }))
          })
        },
      })

      startTransition(() => {
        setDownloadStates((current) => ({
          ...current,
          [book.id]: { status: 'completed', progress: 100, error: null },
        }))
      })
      queryClient.invalidateQueries({ queryKey: ['stored-books'] })
    } catch (error) {
      startTransition(() => {
        setDownloadStates((current) => ({
          ...current,
          [book.id]: {
            status: 'failed',
            progress: 0,
            error: error instanceof Error ? error.message : 'Falha ao baixar o livro.',
          },
        }))
      })
      queryClient.invalidateQueries({ queryKey: ['stored-books'] })
    }
  }

  const handleOpen = async (book) => {
    const nextPath = `/book/${book.id}`

    if (typeof window !== 'undefined') {
      window.location.assign(nextPath)
      return
    }

    navigate(nextPath)
  }

  const handleDelete = async (book) => {
    deleteDialog.open({
      title: 'Remover livro?',
      description: `Tem certeza que deseja remover "${book.title}" do dispositivo? O livro continuará disponível para re-baixar depois.`,
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
      isDangerous: true,
      onConfirm: async () => {
        try {
          deleteDialog.setLoading(true)

          startTransition(() => {
            setDownloadStates((current) => ({
              ...current,
              [book.id]: { status: 'pending', progress: 0, error: null },
            }))
          })

          await removeBook(book)

          startTransition(() => {
            setDownloadStates((current) => ({
              ...current,
              [book.id]: { status: 'idle', progress: 0, error: null },
            }))
          })
          queryClient.invalidateQueries({ queryKey: ['stored-books'] })
          deleteDialog.close()
        } catch (error) {
          startTransition(() => {
            setDownloadStates((current) => ({
              ...current,
              [book.id]: {
                status: 'failed',
                progress: 0,
                error: error instanceof Error ? error.message : 'Falha ao remover o livro.',
              },
            }))
          })
          queryClient.invalidateQueries({ queryKey: ['stored-books'] })
          deleteDialog.setLoading(false)
        }
      },
    })
  }

  const handleRefresh = () => {
    setCurrentPage(1)
    queryClient.invalidateQueries({ queryKey: ['books-sync', apiBaseUrl] })
  }

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const showSkeleton =
    (!probeReady && books.length === 0) ||
    storedBooksQuery.isLoading ||
    (storedBooksQuery.isFetching && books.length === 0) ||
    (isOnline && syncBooksQuery.isLoading && books.length === 0)

  return {
    books,
    visibleBooks,
    paginatedBooks,
    currentPage: safePage,
    totalPages,
    goToPage,
    downloadedCount,
    downloadStates,
    openingBookId,
    hasApiConfig,
    isOnline,
    isUsingCache,
    showSkeleton,
    syncErrorMessage,
    syncBooksQuery,
    deleteDialog,
    handleDownload,
    handleOpen,
    handleDelete,
    handleRefresh,
  }
}