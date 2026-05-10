import { BookOpenText, RefreshCcw, TriangleAlert } from 'lucide-react'
import BookCard from '../../components/BookCard.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import { useBookDownload } from '../../hooks/useBookDownload.js'

function ShelfSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-[26px] border border-[var(--color-line)] bg-[var(--color-paper)] p-5 shadow-[var(--shadow-card)]"
        >
          <div className="h-4 w-24 rounded-full bg-[var(--color-accent-soft)]" />
          <div className="mt-4 h-8 w-2/3 rounded-full bg-[rgba(47,36,25,0.08)]" />
          <div className="mt-3 h-4 w-full rounded-full bg-[rgba(47,36,25,0.06)]" />
          <div className="mt-2 h-4 w-4/5 rounded-full bg-[rgba(47,36,25,0.06)]" />
          <div className="mt-5 h-12 rounded-2xl bg-[rgba(47,36,25,0.08)]" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ isOnline, hasConfig, isUsingCache }) {
  return (
    <section className="rounded-[28px] border border-dashed border-[var(--color-line)] bg-[rgba(255,251,244,0.5)] p-8 text-center shadow-[var(--shadow-card)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
        <BookOpenText className="h-8 w-8" />
      </div>
      <h2 className="font-display mt-5 text-3xl text-[var(--color-ink)]">Nenhum livro visível</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
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
      <section className="rounded-[32px] border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-6 shadow-[var(--shadow-card)] backdrop-blur-md sm:px-7 sm:py-8">
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[rgba(255,255,255,0.48)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted)]">
            <BookOpenText className="h-3.5 w-3.5" />
            Sua estante
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-line)] bg-[rgba(255,255,255,0.58)] text-[var(--color-ink)] transition-transform duration-300 hover:rotate-12"
            aria-label="Atualizar estante"
          >
            <RefreshCcw className={`h-4 w-4 ${syncBooksQuery.isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <h1 className="font-display mt-5 text-xl leading-[0.98] text-[var(--color-ink)] text-balance sm:text-4xl">
          Leia com calma, mesmo quando a internet nao ajudar.
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
          Guarde seus livros favoritos no aparelho e continue estudando no seu ritmo, online ou offline.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-[22px] border border-[var(--color-line)] bg-[rgba(255,255,255,0.56)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Biblioteca</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{books.length}</p>
          </div>
          <div className="rounded-[22px] border border-[var(--color-line)] bg-[rgba(255,255,255,0.56)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Guardados</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{downloadedCount}</p>
          </div>
          <div className="rounded-[22px] border border-[var(--color-line)] bg-[rgba(255,255,255,0.56)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Momento</p>
            <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">{isOnline ? 'conectado' : 'sem rede'}</p>
          </div>
        </div>
      </section>

      {syncErrorMessage ? (
        <section className="rounded-[24px] border border-[rgba(138,69,48,0.14)] bg-[rgba(255,244,234,0.86)] px-4 py-4 text-sm text-[var(--color-danger)] shadow-[var(--shadow-card)]">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="leading-6">{syncErrorMessage}</p>
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