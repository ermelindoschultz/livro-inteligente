import { useState } from 'react'

export function useConfirmDialog() {
  const [state, setState] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    isDangerous: false,
    isLoading: false,
    onConfirm: null,
    onCancel: null,
  })

  const open = (options = {}) => {
    setState((current) => ({
      ...current,
      isOpen: true,
      title: options.title || '',
      description: options.description || '',
      confirmLabel: options.confirmLabel || 'Confirmar',
      cancelLabel: options.cancelLabel || 'Cancelar',
      isDangerous: options.isDangerous ?? false,
      isLoading: false,
      onConfirm: options.onConfirm || null,
      onCancel: options.onCancel || null,
    }))
  }

  const close = () => {
    setState((current) => ({
      ...current,
      isOpen: false,
    }))
  }

  const setLoading = (isLoading) => {
    setState((current) => ({
      ...current,
      isLoading,
    }))
  }

  const handleConfirm = () => {
    state.onConfirm?.()
  }

  const handleCancel = () => {
    close()
    state.onCancel?.()
  }

  return {
    isOpen: state.isOpen,
    title: state.title,
    description: state.description,
    confirmLabel: state.confirmLabel,
    cancelLabel: state.cancelLabel,
    isDangerous: state.isDangerous,
    isLoading: state.isLoading,
    open,
    close,
    setLoading,
    handleConfirm,
    handleCancel,
  }
}
