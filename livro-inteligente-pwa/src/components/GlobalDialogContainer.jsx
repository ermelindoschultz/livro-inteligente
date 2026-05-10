import { useGlobalDialog } from '../hooks/useGlobalDialog.js'
import AiInstructionsDialog from './AiInstructionsDialog.jsx'

const DIALOG_COMPONENTS = {
  'ai-instructions': AiInstructionsDialog,
}

export default function GlobalDialogContainer() {
  try {
    const context = useGlobalDialog()
    
    if (!context) {
      return null
    }
    
    const { dialogType, dialogProps = {}, closeDialog } = context

    if (!dialogType) {
      return null
    }
    
    const Component = DIALOG_COMPONENTS[dialogType]
    
    if (!Component) {
      console.warn('GlobalDialogContainer: Unknown dialog type', { dialogType })
      return null
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-96 rounded-[24px] border border-[var(--color-line)] bg-[var(--color-paper)] shadow-2xl p-6">
          <Component onClose={closeDialog} {...dialogProps} />
        </div>
      </div>
    )
  } catch (error) {
    console.error('GlobalDialogContainer error:', error)
    return null
  }
}
