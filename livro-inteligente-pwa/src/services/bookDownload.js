import { ensureBookRecord, removeBook as removeBookFromDb, updateBookRecord } from './db.js'
import { resolvePublicBookUrl } from './api.js'

const DOWNLOAD_CONCURRENCY = 6
const EXPLICIT_ASSET_KEYS = ['files', 'assets', 'resources', 'downloadables']

function withTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`
}

function shouldSkipAssetRewrite(value) {
  return (
    !value ||
    value.startsWith('#') ||
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    value.startsWith('javascript:') ||
    value.startsWith('mailto:') ||
    value.startsWith('tel:')
  )
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

function resolveManifestUrl(book) {
  if (book.manifestUrl) {
    return book.manifestUrl
  }

  const publicBookUrl = resolvePublicBookUrl(book)

  if (!publicBookUrl) {
    throw new Error('O livro não possui publicUrl nem R2 configurado para resolver o manifest.json.')
  }

  return new URL('manifest.json', withTrailingSlash(publicBookUrl)).toString()
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

function extractManifestAssetUrls(entries, manifestUrl) {
  if (!Array.isArray(entries)) {
    return []
  }

  const urls = entries
    .filter((entry) => typeof entry === 'string' && entry.length > 0)
    .map((entry) => {
      try {
        return new URL(entry, manifestUrl).toString()
      } catch {
        return null
      }
    })
    .filter(Boolean)

  return [...new Set(urls)]
}

async function fetchJson(url, errorMessage) {
  const response = await fetch(url, { cache: 'no-store' })

  if (!response.ok) {
    throw new Error(errorMessage)
  }

  return response
}

async function loadManifestEntries(manifestUrl) {
  try {
    const manifestResponse = await fetch(manifestUrl, { cache: 'no-store' })

    if (manifestResponse.status === 404) {
      return {
        manifestEntries: null,
        manifestResponse: null,
        usedFallback: true,
      }
    }

    if (!manifestResponse.ok) {
      throw new Error(`Falha ao carregar manifest.json em ${manifestUrl}.`)
    }

    const manifestEntries = await manifestResponse.clone().json()

    if (!Array.isArray(manifestEntries)) {
      throw new Error('O manifest.json do livro não contém uma lista de arquivos.')
    }

    return {
      manifestEntries,
      manifestResponse,
      usedFallback: false,
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('O manifest.json do livro não é um JSON válido.', { cause: error })
    }

    throw error
  }
}

async function cacheRemoteAsset(cache, url) {
  const response = await fetch(url, { cache: 'no-store' })

  if (!response.ok) {
    throw new Error(`Falha ao baixar o ativo ${url}.`)
  }

  await cache.put(url, response.clone())
}

async function replaceCacheContents(targetCacheName, sourceCacheName) {
  const sourceCache = await caches.open(sourceCacheName)
  const sourceRequests = await sourceCache.keys()

  await caches.delete(targetCacheName)
  const targetCache = await caches.open(targetCacheName)

  await Promise.all(
    sourceRequests.map(async (request) => {
      const response = await sourceCache.match(request)

      if (response) {
        await targetCache.put(request, response)
      }
    }),
  )
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

function resolveChapterUrl(book, chapter) {
  const metadataUrl = resolveMetadataUrl(book)

  if (!chapter?.file_path) {
    throw new Error('O capitulo informado nao possui file_path no metadata.json.')
  }

  return new URL(chapter.file_path, metadataUrl).toString()
}

const FONT_AWESOME_KIT_PATTERN = /kit\.fontawesome\.com/
const FONT_AWESOME_CACHE_PATTERN = /font-?awesome/i

async function extractExtraStylesheetUrls(documentNode, cache) {
  const extra = []

  const hasFontAwesomeKit = [...documentNode.body.querySelectorAll('script[src]')].some(
    (scriptElement) => FONT_AWESOME_KIT_PATTERN.test(scriptElement.getAttribute('src') ?? ''),
  )

  if (hasFontAwesomeKit) {
    // Find the Font Awesome CSS that was downloaded as part of the book manifest,
    // identified by URL pattern rather than a hardcoded URL in the PWA.
    const cachedRequests = await cache.keys()
    const faCssRequest = cachedRequests.find((req) => FONT_AWESOME_CACHE_PATTERN.test(req.url))
    if (faCssRequest) {
      extra.push(faCssRequest.url)
    }
  }

  return extra
}

function absolutizeBodyAssets(documentNode, chapterUrl) {
  const selectors = ['img[src]', 'source[src]', 'video[src]', 'audio[src]', 'track[src]', 'a[href]', 'iframe[src]']

  for (const element of documentNode.body.querySelectorAll(selectors.join(','))) {
    const attributeName = element.hasAttribute('href') ? 'href' : 'src'
    const currentValue = element.getAttribute(attributeName)

    if (shouldSkipAssetRewrite(currentValue)) {
      continue
    }

    try {
      element.setAttribute(attributeName, new URL(currentValue, chapterUrl).toString())
    } catch {
      // Ignore malformed relative asset paths and keep the original value.
    }
  }

  for (const element of documentNode.body.querySelectorAll('[poster]')) {
    const currentValue = element.getAttribute('poster')

    if (shouldSkipAssetRewrite(currentValue)) {
      continue
    }

    try {
      element.setAttribute('poster', new URL(currentValue, chapterUrl).toString())
    } catch {
      // Ignore malformed poster paths and keep the original value.
    }
  }

  for (const scriptElement of documentNode.body.querySelectorAll('script')) {
    scriptElement.remove()
  }
}

export async function getChapterContent(book, chapter) {
  const cache = await caches.open(`book-store-${book.id}`)
  const chapterUrl = resolveChapterUrl(book, chapter)
  const cachedChapterResponse = await cache.match(chapterUrl)

  if (!cachedChapterResponse) {
    throw new Error('A pagina solicitada nao foi encontrada no cache local do livro.')
  }

  const html = await cachedChapterResponse.text()
  const documentNode = new DOMParser().parseFromString(html, 'text/html')

  if (!documentNode?.body) {
    throw new Error('Nao foi possivel interpretar o HTML do capitulo offline.')
  }

  const extraStylesheetUrls = await extractExtraStylesheetUrls(documentNode, cache)

  absolutizeBodyAssets(documentNode, chapterUrl)

  const rawStylesheetUrls = [...documentNode.querySelectorAll('link[rel~="stylesheet"][href]')]
    .map((linkElement) => linkElement.getAttribute('href'))
    .filter(Boolean)
    .map((href) => {
      try {
        return new URL(href, chapterUrl).toString()
      } catch {
        return null
      }
    })
    .filter(Boolean)

  const uniqueStylesheetUrls = [...new Set([...rawStylesheetUrls, ...extraStylesheetUrls])]

  const stylesheets = await Promise.all(
    uniqueStylesheetUrls.map(async (url) => {
      try {
        const response = await cache.match(url)
        if (response) {
          const content = await response.text()
          return { url, content }
        }
      } catch {
        // ignore cache errors for individual stylesheets
      }
      return { url, content: null }
    }),
  )

  return {
    bodyHtml: documentNode.body.innerHTML,
    stylesheets,
    chapterUrl,
  }
}

export async function downloadBook(book, options = {}) {
  const { onProgress } = options
  const cacheName = `book-store-${book.id}`
  const tempCacheName = `${cacheName}-dl`
  const metadataUrl = resolveMetadataUrl(book)
  const manifestUrl = resolveManifestUrl(book)
  let completed = 0

  await ensureBookRecord(book)
  await updateBookRecord(book.id, {
    downloadStatus: 'pending',
    downloadProgress: 0,
    isDownloaded: false,
    metadataUrl,
  })

  try {
    await caches.delete(tempCacheName)
    const cache = await caches.open(tempCacheName)
    const metadataResponse = await fetchJson(metadataUrl, `Falha ao carregar metadata.json do livro ${book.id}.`)

    await cache.put(metadataUrl, metadataResponse.clone())
    const metadata = await metadataResponse.json()
    const { manifestEntries, manifestResponse, usedFallback } = await loadManifestEntries(manifestUrl)

    if (manifestResponse) {
      await cache.put(manifestUrl, manifestResponse.clone())
    }

    const manifestAssetUrls = manifestEntries ? extractManifestAssetUrls(manifestEntries, manifestUrl) : []
    const assetUrls = (manifestEntries ? manifestAssetUrls : extractAssetUrls(metadata, metadataUrl))
      .filter((assetUrl) => assetUrl !== metadataUrl && assetUrl !== manifestUrl)

    const totalFiles = assetUrls.length + 1 + (manifestResponse ? 1 : 0)

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

    if (manifestResponse) {
      completed += 1
      await updateBookRecord(book.id, {
        downloadStatus: 'pending',
        downloadProgress: Math.round((completed / totalFiles) * 100),
        fileCount: totalFiles,
        cachedFileCount: completed,
      })

      notifyProgress(onProgress, completed, totalFiles)
    }

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

    await replaceCacheContents(cacheName, tempCacheName)
    await caches.delete(tempCacheName)

    await updateBookRecord(book.id, {
      downloadStatus: 'completed',
      downloadProgress: 100,
      fileCount: totalFiles,
      cachedFileCount: totalFiles,
      isDownloaded: true,
      downloadedAt: new Date().toISOString(),
      metadataSnapshot: metadata,
      metadataUrl,
      manifestUrl,
      downloadSource: usedFallback ? 'metadata-fallback' : 'manifest',
    })

    return {
      metadata,
      totalFiles,
    }
  } catch (error) {
    await caches.delete(tempCacheName)
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

export async function removeBook(book) {
  const cacheDeleted = await caches.delete(`book-store-${book.id}`)

  if (!cacheDeleted) {
    console.warn(`Cache para livro ${book.id} não encontrado, continuando com limpeza do banco.`)
  }

  await removeBookFromDb(book.id)

  return { cacheDeleted }
}