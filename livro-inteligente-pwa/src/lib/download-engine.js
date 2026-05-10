import { ensureBookRecord, updateBookRecord } from './db.js'
import { resolvePublicBookUrl } from './books-api.js'

const DOWNLOAD_CONCURRENCY = 6
const EXPLICIT_ASSET_KEYS = ['files', 'assets', 'resources', 'downloadables']

function withTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveMetadataUrl(book) {
  if (book.metadataUrl) {
    return book.metadataUrl
  }

  const publicBookUrl = resolvePublicBookUrl(book)

  if (!publicBookUrl) {
    throw new Error('O livro não possui publicUrl nem R2 configurado para resolver o metadata.json.')
  }

  return new URL('metadata.json', withTrailingSlash(publicBookUrl)).toString()
}

function normalizeAssetDescriptor(entry) {
  if (typeof entry === 'string') {
    return entry
  }

  if (!entry || typeof entry !== 'object') {
    return null
  }

  return entry.url ?? entry.path ?? entry.filePath ?? entry.file ?? entry.href ?? entry.src ?? null
}

function extractAssetUrls(metadata, metadataUrl) {
  const candidates = []

  for (const key of EXPLICIT_ASSET_KEYS) {
    if (!Array.isArray(metadata?.[key])) {
      continue
    }

    for (const entry of metadata[key]) {
      const asset = normalizeAssetDescriptor(entry)
      if (asset) {
        candidates.push(asset)
      }
    }
  }

  if (Array.isArray(metadata?.chapters)) {
    for (const chapter of metadata.chapters) {
      if (chapter?.file_path) {
        candidates.push(chapter.file_path)
      }

      if (chapter?.markdown_path) {
        candidates.push(chapter.markdown_path)
      }
    }
  }

  const urls = candidates
    .map((asset) => {
      try {
        return new URL(asset, metadataUrl).toString()
      } catch {
        return null
      }
    })
    .filter(Boolean)

  return [...new Set(urls)].filter((url) => url !== metadataUrl)
}

async function cacheRemoteAsset(cache, url) {
  const response = await fetch(url, { cache: 'no-store' })

  if (!response.ok) {
    throw new Error(`Falha ao baixar o ativo ${url}.`)
  }

  await cache.put(url, response.clone())
}

async function runWithConcurrency(items, limit, worker) {
  let nextIndex = 0

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      await worker(items[currentIndex], currentIndex)
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, runWorker)
  await Promise.all(workers)
}

function notifyProgress(onProgress, completed, total) {
  if (!onProgress) {
    return
  }

  onProgress({
    completed,
    total,
    percent: total === 0 ? 100 : Math.round((completed / total) * 100),
  })
}

function resolveEntryPath(metadata) {
  return (
    metadata?.entry ??
    metadata?.startPage ??
    metadata?.homepage ??
    metadata?.chapters?.[0]?.file_path ??
    null
  )
}

export async function downloadBook(book, options = {}) {
  const { onProgress } = options
  const cacheName = `book-store-${book.id}`
  const metadataUrl = resolveMetadataUrl(book)
  let completed = 0

  await ensureBookRecord(book)
  await updateBookRecord(book.id, {
    downloadStatus: 'pending',
    downloadProgress: 0,
    isDownloaded: false,
    metadataUrl,
  })

  try {
    await caches.delete(cacheName)
    const cache = await caches.open(cacheName)
    const metadataResponse = await fetch(metadataUrl, { cache: 'no-store' })

    if (!metadataResponse.ok) {
      throw new Error(`Falha ao carregar metadata.json do livro ${book.id}.`)
    }

    await cache.put(metadataUrl, metadataResponse.clone())
    const metadata = await metadataResponse.json()
    const assetUrls = extractAssetUrls(metadata, metadataUrl)
    const totalFiles = assetUrls.length + 1

    completed = 1
    await updateBookRecord(book.id, {
      downloadStatus: 'pending',
      downloadProgress: Math.round((completed / totalFiles) * 100),
      fileCount: totalFiles,
      cachedFileCount: completed,
      metadataSnapshot: metadata,
      metadataUrl,
    })
    notifyProgress(onProgress, completed, totalFiles)

    await runWithConcurrency(assetUrls, DOWNLOAD_CONCURRENCY, async (assetUrl) => {
      await cacheRemoteAsset(cache, assetUrl)
      completed += 1

      await updateBookRecord(book.id, {
        downloadStatus: 'pending',
        downloadProgress: Math.round((completed / totalFiles) * 100),
        fileCount: totalFiles,
        cachedFileCount: completed,
      })

      notifyProgress(onProgress, completed, totalFiles)
    })

    await updateBookRecord(book.id, {
      downloadStatus: 'completed',
      downloadProgress: 100,
      fileCount: totalFiles,
      cachedFileCount: totalFiles,
      isDownloaded: true,
      downloadedAt: new Date().toISOString(),
      metadataSnapshot: metadata,
      metadataUrl,
    })

    return {
      metadata,
      totalFiles,
    }
  } catch (error) {
    await caches.delete(cacheName)
    await updateBookRecord(book.id, {
      downloadStatus: 'failed',
      downloadProgress: 0,
      isDownloaded: false,
      cachedFileCount: completed,
      metadataUrl,
    })
    throw error
  }
}

export async function openBook(book) {
  const publicBookUrl = resolvePublicBookUrl(book)

  if (typeof window !== 'undefined' && navigator.onLine && publicBookUrl) {
    window.open(publicBookUrl, '_blank', 'noopener,noreferrer')
    await updateBookRecord(book.id, { lastOpenedAt: new Date().toISOString() })
    return { mode: 'remote' }
  }

  const cache = await caches.open(`book-store-${book.id}`)
  const metadataUrl = resolveMetadataUrl(book)
  const cachedMetadataResponse = book.metadataSnapshot
    ? null
    : await cache.match(metadataUrl)

  const metadata =
    book.metadataSnapshot ??
    (cachedMetadataResponse ? await cachedMetadataResponse.json() : null)

  if (!metadata) {
    throw new Error('Os metadados offline deste livro ainda não estão disponíveis.')
  }

  const entryPath = resolveEntryPath(metadata)

  if (!entryPath) {
    throw new Error('O metadata.json não informa uma página inicial para abertura offline.')
  }

  const entryUrl = new URL(entryPath, metadataUrl).toString()
  const cachedEntryResponse = await cache.match(entryUrl)

  if (!cachedEntryResponse) {
    throw new Error('A página inicial não foi encontrada no cache local do livro.')
  }

  const entryBlob = await cachedEntryResponse.blob()
  const objectUrl = URL.createObjectURL(entryBlob)
  window.open(objectUrl, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
  await updateBookRecord(book.id, { lastOpenedAt: new Date().toISOString() })

  return { mode: 'offline' }
}