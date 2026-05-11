import React from 'react'
import { createPortal } from 'react-dom'
import LoadingSpinner from './LoadingSpinner'

type ButtonVariant = 'danger' | 'primary' | 'secondary'

type ModalButton = {
  label: string
  onClick: () => void
  variant?: ButtonVariant
  loading?: boolean
}

type Props = {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: React.ReactNode
  confirmButton: ModalButton
  cancelButton?: ModalButton
}

const variantStyles: Record<ButtonVariant, string> = {
  danger: 'bg-red-600 hover:bg-red-500 text-white',
  primary: 'bg-white hover:bg-neutral-200 text-neutral-900',
  secondary: 'bg-white/10 hover:bg-white/15 text-neutral-300',
}

const ConfirmModal: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  description,
  confirmButton,
  cancelButton,
}) => {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm mx-4 rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>

        {description && (
          <div className="text-sm text-gray-400 mb-6">{description}</div>
        )}

        <div className="flex gap-3 justify-end">
          {cancelButton && (
            <button
              onClick={cancelButton.onClick}
              disabled={confirmButton.loading}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                confirmButton.loading 
                  ? 'opacity-50 cursor-not-allowed ' + variantStyles[cancelButton.variant ?? 'secondary']
                  : variantStyles[cancelButton.variant ?? 'secondary']
              }`}
            >
              {cancelButton.label}
            </button>
          )}
          <button
            onClick={confirmButton.onClick}
            disabled={confirmButton.loading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              confirmButton.loading
                ? 'opacity-75 cursor-not-allowed ' + variantStyles[confirmButton.variant ?? 'primary']
                : variantStyles[confirmButton.variant ?? 'primary']
            }`}
          >
            {confirmButton.loading && <LoadingSpinner size="sm" />}
            {confirmButton.label}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ConfirmModal
