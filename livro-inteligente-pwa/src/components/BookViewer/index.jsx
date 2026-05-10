import { useEffect, useRef } from 'react'
import { LoaderCircle } from 'lucide-react'

const BASE_READER_STYLES = `
  :host {
    display: block;
    color: #2f2419;
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

  .book-reader-root .content {
    max-width: min(78ch, 100%);
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

export default function BookViewer({ bodyHtml, chapterTitle, isLoading, stylesheetUrls }) {
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

    for (const stylesheetUrl of stylesheetUrls) {
      const linkElement = document.createElement('link')
      linkElement.rel = 'stylesheet'
      linkElement.href = stylesheetUrl
      shadowRoot.appendChild(linkElement)
    }

    const contentWrapper = document.createElement('div')
    contentWrapper.className = 'book-reader-root'
    contentWrapper.innerHTML = bodyHtml
    shadowRoot.appendChild(contentWrapper)

    hostRef.current.scrollTo({ top: 0, behavior: 'smooth' })
  }, [bodyHtml, stylesheetUrls])

  return (
    <div className="relative h-full min-h-[68svh] overflow-hidden rounded-[24px] border border-[rgba(106,80,45,0.12)] bg-[rgba(255,255,255,0.72)] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] sm:min-h-[72svh]">
      <div ref={hostRef} className="h-full overflow-auto px-0 py-0" aria-label={chapterTitle || 'Conteudo do livro'} />

      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[rgba(255,250,241,0.78)] backdrop-blur-[2px]">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-paper-strong)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] shadow-[0_12px_30px_rgba(47,36,25,0.12)]">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Carregando pagina
          </div>
        </div>
      ) : null}
    </div>
  )
}
