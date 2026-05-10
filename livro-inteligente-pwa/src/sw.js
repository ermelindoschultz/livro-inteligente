/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'

self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

const r2PublicRoot = (import.meta.env.VITE_R2_PUBLIC_ROOT ?? '').replace(/\/+$/, '')
const navigationHandler = createHandlerBoundToURL('/index.html')

registerRoute(
  ({ request, url }) =>
    request.mode === 'navigate' &&
    !url.pathname.startsWith('/api/') &&
    !url.pathname.startsWith('/assets/') &&
    !/\/[^/?]+\.[^/]+$/.test(url.pathname),
  navigationHandler,
)

registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin && ['document', 'script', 'style', 'worker'].includes(request.destination),
  new StaleWhileRevalidate({
    cacheName: 'app-shell',
  }),
)

registerRoute(
  ({ url }) => Boolean(r2PublicRoot) && url.href.startsWith(r2PublicRoot),
  async ({ request }) => {
    const cacheNames = await caches.keys()
    const bookCacheNames = cacheNames.filter((cacheName) => cacheName.startsWith('book-store-'))

    for (const cacheName of bookCacheNames) {
      const cache = await caches.open(cacheName)
      const cachedResponse = await cache.match(request.url)

      if (cachedResponse) {
        return cachedResponse
      }
    }

    return fetch(request)
  },
)

registerRoute(
  ({ request, url }) =>
    (!r2PublicRoot || !url.href.startsWith(r2PublicRoot)) &&
    (['image', 'font'].includes(request.destination) || /\.(?:html|json|md)$/i.test(url.pathname)),
  new CacheFirst({
    cacheName: 'book-assets-runtime',
  }),
)
