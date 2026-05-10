import Dexie from 'dexie'

export const BOOKS_CHANGED_EVENT = 'livro-inteligente:books-changed'
export const AI_COINS_CHANGED_EVENT = 'livro-inteligente:ai-coins-changed'

const DEFAULT_AI_COINS = 5

export const libraryDb = new Dexie('livro-inteligente-pwa')

libraryDb.version(1).stores({
  books: 'id, title, isDownloaded, downloadStatus, updatedAt, lastSyncedAt',
  readingProgress: '++id, bookId, chapterId, updatedAt',
})

libraryDb.version(2).stores({
  books: 'id, title, isDownloaded, downloadStatus, updatedAt, lastSyncedAt',
  readingProgress: '++id, bookId, chapterId, updatedAt',
  gameProgress: '[bookId+challengeId], bookId, challengeId, bossDefeated, updatedAt',
})

libraryDb.version(3).stores({
  books: 'id, title, isDownloaded, downloadStatus, updatedAt, lastSyncedAt',
  readingProgress: '++id, bookId, chapterId, updatedAt',
  gameProgress: '[bookId+challengeId], bookId, challengeId, bossDefeated, updatedAt',
  aiCoins: 'bookId, updatedAt',
})

function now() {
  return new Date().toISOString()
}

function emitBooksChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BOOKS_CHANGED_EVENT))
  }
}

function emitAiCoinsChanged(bookId, coins) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AI_COINS_CHANGED_EVENT, { detail: { bookId, coins } }))
  }
}

function normalizeBookRecord(book, currentBook) {
  const timestamp = now()

  return {
    id: book.id,
    title: book.title ?? currentBook?.title ?? `Livro ${book.id}`,
    description: book.description ?? currentBook?.description ?? null,
    authors: Array.isArray(book.authors) ? book.authors : currentBook?.authors ?? [],
    folderName: book.folderName ?? currentBook?.folderName ?? null,
    status: book.status ?? currentBook?.status ?? null,
    r2FolderPath: book.r2FolderPath ?? currentBook?.r2FolderPath ?? null,
    publishedAt: book.publishedAt ?? currentBook?.publishedAt ?? null,
    publicUrl: book.publicUrl ?? currentBook?.publicUrl ?? null,
    metadataUrl: book.metadataUrl ?? currentBook?.metadataUrl ?? null,
    metadataSnapshot: book.metadataSnapshot ?? currentBook?.metadataSnapshot ?? null,
    isDownloaded: book.isDownloaded ?? currentBook?.isDownloaded ?? false,
    downloadStatus: book.downloadStatus ?? currentBook?.downloadStatus ?? 'idle',
    downloadProgress: book.downloadProgress ?? currentBook?.downloadProgress ?? 0,
    fileCount: book.fileCount ?? currentBook?.fileCount ?? 0,
    cachedFileCount: book.cachedFileCount ?? currentBook?.cachedFileCount ?? 0,
    lastReadChapterId: book.lastReadChapterId ?? currentBook?.lastReadChapterId ?? null,
    downloadedAt: book.downloadedAt ?? currentBook?.downloadedAt ?? null,
    lastOpenedAt: book.lastOpenedAt ?? currentBook?.lastOpenedAt ?? null,
    lastSyncedAt: book.lastSyncedAt ?? currentBook?.lastSyncedAt ?? timestamp,
    updatedAt: timestamp,
  }
}

export async function listStoredBooks() {
  return libraryDb.books.toArray()
}

export async function listCachedBooks() {
  return libraryDb.books.where('lastSyncedAt').notEqual(null).toArray()
}

export async function getStoredBookById(bookId) {
  return libraryDb.books.get(bookId)
}

export async function ensureBookRecord(book) {
  const currentBook = await libraryDb.books.get(book.id)
  const record = normalizeBookRecord(book, currentBook)
  await libraryDb.books.put(record)
  emitBooksChanged()
  return record
}

export async function syncRemoteBooks(books) {
  const currentBooks = await libraryDb.books.bulkGet(books.map((book) => book.id))

  const records = books.map((book, index) =>
    normalizeBookRecord({ ...book, lastSyncedAt: now() }, currentBooks[index]),
  )

  await libraryDb.books.bulkPut(records)
  emitBooksChanged()
  return records
}

export async function updateBookRecord(bookId, patch) {
  const currentBook = await libraryDb.books.get(bookId)

  if (!currentBook) {
    throw new Error(`Livro ${bookId} ainda não está persistido localmente.`)
  }

  const record = normalizeBookRecord({ ...currentBook, ...patch }, currentBook)
  await libraryDb.books.put(record)
  emitBooksChanged()
  return record
}

async function getOrCreateAiCoinsRecord(bookId) {
  if (!Number.isInteger(bookId) || bookId <= 0) {
    throw new Error('bookId precisa ser um inteiro positivo para controlar moedas de IA.')
  }

  const existingRecord = await libraryDb.aiCoins.get(bookId)

  if (existingRecord) {
    return existingRecord
  }

  const record = {
    bookId,
    coins: DEFAULT_AI_COINS,
    updatedAt: now(),
  }

  await libraryDb.aiCoins.put(record)
  emitAiCoinsChanged(bookId, record.coins)
  return record
}

export async function initCoinsForBook(bookId) {
  const record = await getOrCreateAiCoinsRecord(bookId)
  return record.coins
}

export async function getCoinsForBook(bookId) {
  const record = await getOrCreateAiCoinsRecord(bookId)
  return record.coins
}

export async function consumeCoinForBook(bookId) {
  return libraryDb.transaction('rw', libraryDb.aiCoins, async () => {
    const record = await getOrCreateAiCoinsRecord(bookId)

    if (record.coins <= 0) {
      throw new Error('Este livro nao possui moedas de IA disponiveis.')
    }

    const nextCoins = record.coins - 1
    await libraryDb.aiCoins.put({
      ...record,
      coins: nextCoins,
      updatedAt: now(),
    })

    emitAiCoinsChanged(bookId, nextCoins)
    return nextCoins
  })
}

export async function addGeneratedTriviaToBook(bookId, chapterId, pageId, triviaContent) {
  const currentBook = await libraryDb.books.get(bookId)

  if (!currentBook) {
    throw new Error(`Livro ${bookId} nao esta persistido localmente.`)
  }

  if (!currentBook.metadataSnapshot || !Array.isArray(currentBook.metadataSnapshot.chapters)) {
    throw new Error('O livro ainda nao possui metadataSnapshot local para receber novas trivias.')
  }

  const nextSnapshot = structuredClone(currentBook.metadataSnapshot)
  const chapter = nextSnapshot.chapters.find((entry) => entry?.id === chapterId)

  if (!chapter) {
    throw new Error(`Capitulo ${chapterId} nao foi encontrado no metadataSnapshot local.`)
  }

  if (!Array.isArray(chapter.enrichment)) {
    chapter.enrichment = []
  }

  chapter.enrichment.push({
    type: 'trivia',
    page_id: pageId,
    content: triviaContent,
    generated_at: now(),
    generated_locally: true,
  })

  return updateBookRecord(bookId, {
    metadataSnapshot: nextSnapshot,
  })
}

export async function saveReadingProgress({ bookId, chapterId, progress }) {
  await libraryDb.readingProgress.add({
    bookId,
    chapterId,
    progress,
    updatedAt: now(),
  })
}

export async function deleteReadingProgress(bookId) {
  await libraryDb.readingProgress.where('bookId').equals(bookId).delete()
}

export async function deleteGameProgress(bookId) {
  await libraryDb.gameProgress.where('bookId').equals(bookId).delete()
}

export async function removeBook(bookId) {
  const currentBook = await libraryDb.books.get(bookId)

  if (!currentBook) {
    throw new Error(`Livro ${bookId} não está persistido localmente.`)
  }

  // Reset download state but keep the book in the database for metadata
  const record = normalizeBookRecord(
    {
      ...currentBook,
      isDownloaded: false,
      downloadStatus: 'idle',
      downloadProgress: 0,
      downloadedAt: null,
    },
    currentBook,
  )
  await libraryDb.books.put(record)

  // Clear reading progress
  await deleteReadingProgress(bookId)
  await deleteGameProgress(bookId)

  emitBooksChanged()
  return record
}