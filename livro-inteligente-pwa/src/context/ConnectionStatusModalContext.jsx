import { createContext, useContext, useState } from 'react'

const ConnectionStatusModalContext = createContext(null)

export function ConnectionStatusModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  return (
    <ConnectionStatusModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </ConnectionStatusModalContext.Provider>
  )
}

export function useConnectionStatusModal() {
  const context = useContext(ConnectionStatusModalContext)
  if (!context) {
    throw new Error('useConnectionStatusModal must be used within ConnectionStatusModalProvider')
  }
  return context
}
