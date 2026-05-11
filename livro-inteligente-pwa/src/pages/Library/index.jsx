import { BookOpen, Reload, WarningDiamond } from 'pixelarticons/react'
import BookCard from '../../components/BookCard.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import { useBookDownload } from '../../hooks/useBookDownload.js'

const pixelStyle = { imageRendering: 'pixelated' }

function ShelfSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse border-2 border-[var(--color-line)] bg-[var(--color-paper)] p-5 shadow-[var(--shadow-card)]"
        >
          <div className="h-3 w-24 bg-[var(--color-accent-soft)]" />
          <div className="mt-4 h-6 w-2/3 bg-[rgba(255,255,255,0.06)]" />
          <div className="mt-3 h-3 w-full bg-[rgba(255,255,255,0.04)]" />
          <div className="mt-2 h-3 w-4/5 bg-[rgba(255,255,255,0.04)]" />
          <div className="mt-5 h-12 bg-[rgba(255,255,255,0.06)]" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ isOnline, hasConfig, isUsingCache }) {
  return (
    <section className="border-2 border-dashed border-[var(--color-line)] bg-[var(--color-paper)] p-8 text-center shadow-[var(--shadow-card)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
        <BookOpen className="h-8 w-8" style={pixelStyle} />
      </div>
      <h2 className="mt-5 text-lg text-[var(--color-ink)] font-[var(--font-display)]">Nenhum livro visivel</h2>
      <p className="mt-3 text-base leading-6 text-[var(--color-muted)] font-[var(--font-sans)]">
        {isOnline
          ? hasConfig
            ? 'Ainda nao encontramos livros disponiveis. Volte em instantes para continuar sua leitura.'
            : 'Sua biblioteca ainda esta sendo preparada.'
          : isUsingCache
            ? 'Sem conexao. Nenhum livro foi ainda guardado neste dispositivo. Conecte-se a internet e sincronize sua biblioteca.'
            : 'Sem conexao, a estante mostra apenas os livros que ja foram guardados no dispositivo.'}
      </p>
    </section>
  )
}

export default function LibraryPage() {
  const {
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
  } = useBookDownload()

  return (
    <>
      <section className="border-2 border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-6 shadow-[var(--shadow-card)] sm:px-7 sm:py-8">
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 border border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-accent)] font-[var(--font-pixel)]">
            <BookOpen className="h-3.5 w-3.5" style={pixelStyle} />
            Sua estante
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex h-10 w-10 items-center justify-center border-2 border-[var(--color-line)] bg-transparent text-[var(--color-ink)] transition-transform duration-200 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            aria-label="Atualizar estante"
          >
            <Reload className={`h-4 w-4 ${syncBooksQuery.isFetching ? 'animate-spin' : ''}`} style={pixelStyle} />
          </button>
        </div>

        <h1 className="mt-5 text-lg leading-tight text-[var(--color-ink)] text-balance sm:text-xl font-[var(--font-display)]">
          Uma estante de livros cheia de desafios.
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)] sm:text-lg font-[var(--font-sans)]">
          Guarde seus desafios no aparelho e continue superando provas e missoes mesmo quando a internet falhar. Seu progresso sempre com voce.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="border-2 border-[var(--color-line)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-muted)] font-[var(--font-pixel)]">Biblioteca</p>
            <p className="mt-2 text-2xl font-bold text-[var(--color-accent)] font-[var(--font-display)]">{books.length}</p>
          </div>
          <div className="border-2 border-[var(--color-line)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-muted)] font-[var(--font-pixel)]">Guardados</p>
            <p className="mt-2 text-2xl font-bold text-[var(--color-success)] font-[var(--font-display)]">{downloadedCount}</p>
          </div>
        </div>
      </section>

      {syncErrorMessage ? (
        <section className="border-2 border-[rgba(232,64,64,0.4)] bg-[var(--color-danger-soft)] px-4 py-4 text-sm text-[var(--color-danger)] shadow-[var(--shadow-card)]">
          <div className="flex items-start gap-3">
            <WarningDiamond className="mt-0.5 h-5 w-5 shrink-0" style={pixelStyle} />
            <p className="leading-6 font-[var(--font-sans)] text-base">{syncErrorMessage}</p>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        {showSkeleton ? (
          <ShelfSkeleton />
        ) : visibleBooks.length > 0 ? (
          visibleBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              openingBookId={openingBookId}
              uiState={downloadStates[book.id]}
              onDownload={handleDownload}
              onOpen={handleOpen}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <EmptyState isOnline={isOnline} hasConfig={hasApiConfig} isUsingCache={isUsingCache} />
        )}
      </section>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title={deleteDialog.title}
        description={deleteDialog.description}
        confirmLabel={deleteDialog.confirmLabel}
        cancelLabel={deleteDialog.cancelLabel}
        isDangerous={deleteDialog.isDangerous}
        isLoading={deleteDialog.isLoading}
        onConfirm={deleteDialog.handleConfirm}
        onCancel={deleteDialog.handleCancel}
      />
    </>
  )
}