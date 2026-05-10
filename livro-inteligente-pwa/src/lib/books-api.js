const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''
const configuredR2PublicRoot = import.meta.env.VITE_R2_PUBLIC_ROOT?.trim() ?? ''

function normalizeBaseUrl(value) {
  return value ? value.replace(/\/+$/, '') : ''
}

function ensureTrailingSlash(value) {
  return value ? `${value.replace(/\/+$/, '')}/` : ''
}

function resolveApiBaseUrl() {
  if (configuredApiBaseUrl) {
    return normalizeBaseUrl(configuredApiBaseUrl)
  }

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8787'
  }

  return ''
}

export const apiBaseUrl = resolveApiBaseUrl()
export const r2PublicRoot = ensureTrailingSlash(configuredR2PublicRoot)

export class ApiConfigurationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ApiConfigurationError'
  }
}

export function resolvePublicBookUrl(book) {
  if (typeof book?.publicUrl === 'string' && book.publicUrl.length > 0) {
    return ensureTrailingSlash(book.publicUrl)
  }

  if (r2PublicRoot && typeof book?.r2FolderPath === 'string' && book.r2FolderPath.length > 0) {
    return new URL(book.r2FolderPath.replace(/^\/+/, ''), r2PublicRoot).toString()
  }

  return null
}

function buildApiUrl(pathname) {
  if (!apiBaseUrl) {
    throw new ApiConfigurationError('VITE_API_BASE_URL não foi configurada.')
  }

  return `${apiBaseUrl}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
}

function normalizeBook(book) {
  return {
    id: Number(book.id),
    title: book.title ?? `Livro ${book.id}`,
    description: book.description ?? null,
    authors: Array.isArray(book.authors) ? book.authors : [],
    folderName: book.folderName ?? null,
    status: book.status ?? null,
    r2FolderPath: book.r2FolderPath ?? null,
    publishedAt: book.publishedAt ?? null,
    publicUrl: resolvePublicBookUrl(book),
  }
}

export async function fetchBooks() {
  const response = await fetch(buildApiUrl('/books'))

  if (!response.ok) {
    throw new Error(`A API respondeu com status ${response.status}.`)
  }

  const payload = await response.json()
  const books = Array.isArray(payload.data) ? payload.data : []

  return books.map(normalizeBook)
}