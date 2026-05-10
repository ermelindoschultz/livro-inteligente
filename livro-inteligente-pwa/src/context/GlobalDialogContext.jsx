import { createContext, useState } from 'react'

export const GlobalDialogContext = createContext(null)

export function GlobalDialogProvider({ children }) {
  const [dialogType, setDialogType] = useState(null)
  const [dialogProps, setDialogProps] = useState({})

  const openDialog = (type, props = {}) => {
    setDialogType(type)
    setDialogProps(props)
  }

  const closeDialog = () => {
    setDialogType(null)
    setDialogProps({})
  }

  return (
    <GlobalDialogContext.Provider value={{ openDialog, closeDialog, dialogType, dialogProps }}>
      {children}
    </GlobalDialogContext.Provider>
  )
}
