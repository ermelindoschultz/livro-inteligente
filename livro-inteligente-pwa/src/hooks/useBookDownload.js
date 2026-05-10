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

export function useBookDownload() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { isOnline } = useConnectivity()
  const [downloadStates, setDownloadStates] = useState({})
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
    initialData: [],
    staleTime: 5_000,
  })

  const syncBooksQuery = useQuery({
    queryKey: ['books-sync', apiBaseUrl, isOnline],
    queryFn: async () => {
      const { books, source } = await fetchBooksWithOfflineSupport(isOnline)
      // Only sync to DB if we got the books from the API
      if (source === 'api') {
        await syncRemoteBooks(books)
      }
      return { books, source }
    },
    retry: isOnline ? 1 : 0,
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
  // When offline, show all cached books. When online, show all books (which are synced from API)
  const visibleBooks = books
  const downloadedCount = books.filter((book) => book.isDownloaded).length
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
    navigate(`/book/${book.id}`)
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
    queryClient.invalidateQueries({ queryKey: ['books-sync', apiBaseUrl] })
  }

  const showSkeleton =
    storedBooksQuery.isLoading || (isOnline && syncBooksQuery.isLoading && books.length === 0)

  return {
    books,
    visibleBooks,
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