import { BookMarked, LibraryBig, WifiOff } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useConnectivity } from '../../hooks/useConnectivity.js'
import ScrollToTop from './ScrollToTop.jsx'

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
          isActive
            ? 'border-transparent bg-[var(--color-ink)] text-[#fffaf2]'
            : 'border-[var(--color-line)] bg-[rgba(255,255,255,0.62)] text-[var(--color-ink)]'
        }`
      }
    >
      {children}
    </NavLink>
  )
}

export default function Layout({ children }) {
  const { isOnline } = useConnectivity()
  const location = useLocation()
  const isReaderRoute = location.pathname.startsWith('/book/')

  return (
    <div
      className={`relative min-h-screen overflow-hidden pb-8 pt-4 sm:pb-10 sm:pt-6 ${
        isReaderRoute ? 'px-2 sm:px-3 lg:px-4' : 'px-4 sm:px-6'
      }`}
    >
      <ScrollToTop />
      <div className="pointer-events-none absolute inset-x-0 top-[-160px] h-[360px] rounded-full bg-[radial-gradient(circle,_rgba(159,111,42,0.18),_transparent_62%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-80px] top-[28%] h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(84,120,100,0.14),_transparent_66%)] blur-3xl" />

      <div
        className={`relative mx-auto flex w-full flex-col gap-4 ${
          isReaderRoute ? 'max-w-6xl xl:max-w-[90rem]' : 'max-w-3xl'
        }`}
      >
        <header className="rounded-[32px] border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-5 shadow-[var(--shadow-card)] backdrop-blur-md sm:px-7 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[rgba(255,255,255,0.48)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted)]"
              >
                <BookMarked className="h-3.5 w-3.5" />
                Livro Inteligente
              </Link>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                Navegacao offline com app shell e leitura a partir da biblioteca local.
              </p>
            </div>

            <nav className="flex flex-wrap gap-2">
              <NavItem to="/">
                <LibraryBig className="h-4 w-4" />
                Estante
              </NavItem>
            </nav>
          </div>
        </header>

        {!isOnline ? (
          <section className="rounded-[24px] border border-[rgba(138,69,48,0.14)] bg-[rgba(255,244,234,0.86)] px-4 py-4 text-sm text-[var(--color-danger)] shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-3">
              <WifiOff className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="leading-6">
                Modo offline ativo. Rotas internas continuam funcionando com o app shell, e a leitura depende apenas dos livros ja baixados.
              </p>
            </div>
          </section>
        ) : null}

        {children ?? <Outlet />}
      </div>
    </div>
  )
}