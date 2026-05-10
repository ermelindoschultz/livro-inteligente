import { createContext, useContext, useState } from 'react'

const WidgetModalContext = createContext(null)

export function WidgetModalProvider({ children }) {
  const [portalNode, setPortalNode] = useState(null)

  return (
    <WidgetModalContext.Provider value={{ portalNode }}>
      {children}
      <div ref={setPortalNode} />
    </WidgetModalContext.Provider>
  )
}

export function useWidgetModal() {
  const context = useContext(WidgetModalContext)

  if (!context) {
    throw new Error('useWidgetModal must be used within WidgetModalProvider')
  }

  return context
}