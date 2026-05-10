import { WifiOff, Wifi } from 'lucide-react'
import { useConnectivity } from '../hooks/useConnectivity.js'
import { useConnectionStatusModal } from '../context/ConnectionStatusModalContext.jsx'

export default function ConnectionStatus() {
  const { isOnline } = useConnectivity()
  const { openModal } = useConnectionStatusModal()

  return (
    <button
      type="button"
      onClick={openModal}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-line)] bg-[rgba(255,255,255,0.58)] text-[var(--color-ink)] transition-all duration-300 hover:scale-105"
      aria-label={isOnline ? 'Conectado' : 'Sem conexão'}
      title={isOnline ? 'Conectado' : 'Sem conexão'}
    >
      {isOnline ? (
        <Wifi className="h-4 w-4 text-[#10b981]" />
      ) : (
        <WifiOff className="h-4 w-4 text-[#ef4444]" />
      )}
    </button>
  )
}
