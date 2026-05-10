/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Layout from './components/Layout/index.jsx'

const LibraryPage = lazy(() => import('./pages/Library/index.jsx'))
const ReaderPage = lazy(() => import('./pages/Reader/index.jsx'))

function RouteFallback() {
  return (
    <div className="rounded-[28px] border border-[var(--color-line)] bg-[var(--color-paper)] p-6 shadow-[var(--shadow-card)]">
      <div className="h-4 w-24 animate-pulse rounded-full bg-[var(--color-accent-soft)]" />
      <div className="mt-4 h-10 w-2/3 animate-pulse rounded-full bg-[rgba(47,36,25,0.08)]" />
      <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-[rgba(47,36,25,0.06)]" />
      <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-[rgba(47,36,25,0.06)]" />
    </div>
  )
}

function withSuspense(element) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>
}

function RouteErrorBoundary() {
  return (
    <section className="rounded-[28px] border border-[rgba(138,69,48,0.18)] bg-[var(--color-danger-soft)] p-6 text-[var(--color-danger)] shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em]">Navegacao</p>
      <h1 className="mt-3 text-2xl font-semibold text-[var(--color-ink)]">Nao foi possivel abrir esta tela.</h1>
      <p className="mt-3 text-sm leading-6">Atualize a aplicacao ou volte para a estante para tentar novamente.</p>
    </section>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: (
      <Layout>
        <RouteErrorBoundary />
      </Layout>
    ),
    children: [
      {
        index: true,
        element: withSuspense(<LibraryPage />),
      },
      {
        path: 'book/:id',
        element: withSuspense(<ReaderPage />),
      },
    ],
  },
])

export default router