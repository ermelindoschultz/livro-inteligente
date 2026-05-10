import Dexie from 'dexie'

export const BOOKS_CHANGED_EVENT = 'livro-inteligente:books-changed'

export const libraryDb = new Dexie('livro-inteligente-pwa')

libraryDb.version(1).stores({
  books: 'id, title, isDownloaded, downloadStatus, updatedAt, lastSyncedAt',
  readingProgress: '++id, bookId, chapterId, updatedAt',
})

function now() {
  return new Date().toISOString()
}

function emitBooksChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BOOKS_CHANGED_EVENT))
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
    downloadedAt: book.downloadedAt ?? currentBook?.downloadedAt ?? null,
    lastOpenedAt: book.lastOpenedAt ?? currentBook?.lastOpenedAt ?? null,
    lastSyncedAt: book.lastSyncedAt ?? currentBook?.lastSyncedAt ?? timestamp,
    updatedAt: timestamp,
  }
}

export async function listStoredBooks() {
  return libraryDb.books.toArray()
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

export async function saveReadingProgress({ bookId, chapterId, progress }) {
  await libraryDb.readingProgress.add({
    bookId,
    chapterId,
    progress,
    updatedAt: now(),
  })
}