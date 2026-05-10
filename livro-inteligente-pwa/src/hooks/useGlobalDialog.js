import { useContext } from 'react'
import { GlobalDialogContext } from '../context/GlobalDialogContext.jsx'

export function useGlobalDialog() {
  const context = useContext(GlobalDialogContext)
  if (!context) {
    throw new Error('useGlobalDialog must be used within GlobalDialogProvider')
  }
  return context
}
