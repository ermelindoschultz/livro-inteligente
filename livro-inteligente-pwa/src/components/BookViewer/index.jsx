import { useEffect, useRef } from 'react'
import { LoaderCircle } from 'lucide-react'

const BASE_READER_STYLES = `
  :host {
    display: block;
    color: #2f2419;
    /* Reset inheritable properties that leak in from the pixel-art theme on the document root */
    font-family: 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    image-rendering: auto;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  .book-reader-root {
    min-height: 100%;
    background: #fffdf8;
    color: #2f2419;
    padding: clamp(1rem, 1vw + 0.8rem, 1.75rem) clamp(1rem, 1.6vw + 0.7rem, 2.5rem) clamp(1.5rem, 1.4vw + 1rem, 2.75rem);
    line-height: 1.75;
    font-size: clamp(1rem, 0.2vw + 0.98rem, 1.08rem);
  }

  .book-reader-root .section.is-medium {
    padding-block: 1rem;
  }

  .book-reader-root .container,
  .book-reader-root .container.is-max-desktop {
    max-width: none;
    width: 100%;
    padding-inline: 0;
  }

  .book-reader-root p,
  .book-reader-root li {
    line-height: 1.8;
  }

  .book-reader-root p + p,
  .book-reader-root .content p + p {
    margin-top: 1rem;
  }

  .book-reader-root img,
  .book-reader-root video,
  .book-reader-root iframe {
    max-width: 100%;
    height: auto;
  }

  @media (max-width: 640px) {
    .book-reader-root {
      padding-inline: 0.9rem;
      padding-top: 0.85rem;
    }
  }
`

export default function BookViewer({ bodyHtml, chapterTitle, isLoading, stylesheets }) {
  const hostRef = useRef(null)

  useEffect(() => {
    if (!hostRef.current) {
      return
    }

    const shadowRoot = hostRef.current.shadowRoot ?? hostRef.current.attachShadow({ mode: 'open' })
    shadowRoot.innerHTML = ''

    const baseStyle = document.createElement('style')
    baseStyle.textContent = BASE_READER_STYLES
    shadowRoot.appendChild(baseStyle)

    for (const { url, content } of stylesheets) {
      if (content !== null) {
        // Inject pre-fetched CSS as an inline <style> so it applies synchronously and
        // works offline without depending on the service worker to intercept the request.
        // `:root` selectors are rewritten to `:host` so CSS custom properties (variables)
        // are defined on the shadow host and inherited by all elements in the shadow tree.
        const styleEl = document.createElement('style')
        styleEl.textContent = content.replace(/:root(?=\s*[{,])/g, ':host')
        shadowRoot.appendChild(styleEl)
      } else {
        // Fall back to <link> for external URLs (e.g. Google Fonts) not in the book cache.
        const linkEl = document.createElement('link')
        linkEl.rel = 'stylesheet'
        linkEl.href = url
        shadowRoot.appendChild(linkEl)
      }
    }

    const contentWrapper = document.createElement('div')
    contentWrapper.className = 'book-reader-root'
    contentWrapper.innerHTML = bodyHtml
    shadowRoot.appendChild(contentWrapper)

    hostRef.current.scrollTo({ top: 0, behavior: 'smooth' })
  }, [bodyHtml, stylesheets])

  return (
    <div className="relative h-full min-h-[68svh] overflow-hidden border-2 border-[var(--color-line)] bg-[rgba(255,255,255,0.72)] sm:min-h-[72svh]">
      <div ref={hostRef} className="h-full overflow-auto px-0 py-0" aria-label={chapterTitle || 'Conteudo do livro'} />

      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[rgba(13,13,13,0.7)]">
          <div className="inline-flex items-center gap-2 border-2 border-[var(--color-accent)] bg-[var(--color-paper-strong)] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-[var(--color-accent)] font-[var(--font-pixel)]">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Carregando
          </div>
        </div>
      ) : null}
    </div>
  )
}
