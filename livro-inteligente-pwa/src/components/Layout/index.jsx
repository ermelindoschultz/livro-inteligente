import { Bookmark, Library, Wifi } from 'pixelarticons/react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useConnectivity } from '../../hooks/useConnectivity.js'
import ConnectionStatus from '../ConnectionStatus.jsx'
import ScrollToTop from './ScrollToTop.jsx'

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `inline-flex items-center gap-2 border-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors font-[var(--font-pixel)] ${
          isActive
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[#0d0d0d]'
            : 'border-[var(--color-line)] bg-transparent text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
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
      className={`relative z-10 min-h-screen overflow-hidden pb-8 pt-4 sm:pb-10 sm:pt-6 ${
        isReaderRoute ? 'px-2 sm:px-3 lg:px-4' : 'px-4 sm:px-6'
      }`}
    >
      <ScrollToTop />

      <div
        className={`relative mx-auto flex w-full flex-col gap-4 ${
          isReaderRoute ? 'max-w-6xl xl:max-w-[90rem]' : 'max-w-3xl'
        }`}
      >
        <header className="border-2 border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-2 shadow-[var(--shadow-card)]">
          <div className="flex flex-row items-center justify-between gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 border border-[var(--color-line)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-accent)] shrink-0 font-[var(--font-pixel)]"
            >
              <Bookmark className="h-3.5 w-3.5 shrink-0" style={{ imageRendering: 'pixelated' }} />
              <span className="hidden sm:inline whitespace-nowrap">Desafio da Leitura Inteligente</span>
            </Link>

            <nav className="flex items-center gap-2 shrink-0">
              <ConnectionStatus />
              <NavItem to="/">
                <Library className="h-4 w-4" style={{ imageRendering: 'pixelated' }} />
                Estante
              </NavItem>
            </nav>
          </div>
        </header>

        {!isOnline ? (
          <section className="border-2 border-[rgba(232,64,64,0.4)] bg-[var(--color-danger-soft)] px-4 py-4 text-sm text-[var(--color-danger)] shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-3">
              <Wifi className="mt-0.5 h-5 w-5 shrink-0 opacity-50" style={{ imageRendering: 'pixelated' }} />
              <p className="leading-6 font-[var(--font-sans)] text-base">
                Você está sem conexão com a internet. Só é possível ler os livros que já foram baixados no seu dispositivo.
              </p>
            </div>
          </section>
        ) : null}

        {children ?? <Outlet />}
      </div>
    </div>
  )
}