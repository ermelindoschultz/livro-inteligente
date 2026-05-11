import { Wifi } from 'pixelarticons/react'
import { useConnectivity } from '../hooks/useConnectivity.js'
import { useConnectionStatusModal } from '../context/ConnectionStatusModalContext.jsx'

export default function ConnectionStatus() {
  const { isOnline } = useConnectivity()
  const { openModal } = useConnectionStatusModal()

  return (
    <button
      type="button"
      onClick={openModal}
      className="inline-flex h-9 w-9 items-center justify-center border-2 border-[var(--color-line)] bg-[rgba(255,255,255,0.04)] text-[var(--color-ink)] transition-all duration-200 hover:border-[var(--color-accent)]"
      aria-label={isOnline ? 'Conectado' : 'Sem conexão'}
      title={isOnline ? 'Conectado' : 'Sem conexão'}
    >
      <Wifi
        className="h-4 w-4"
        style={{ imageRendering: 'pixelated', color: isOnline ? '#50c878' : '#e84040', opacity: isOnline ? 1 : 0.5 }}
      />
    </button>
  )
}
