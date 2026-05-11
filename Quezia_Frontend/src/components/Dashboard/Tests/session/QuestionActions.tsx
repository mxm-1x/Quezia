import React from 'react'
import { Flag, Eraser } from '@phosphor-icons/react'

type Props = {
  isMarkedForReview: boolean
  onMarkForReview: () => void
  onClearResponse: () => void
  hasResponse: boolean
}

const QuestionActions: React.FC<Props> = ({
  isMarkedForReview,
  onMarkForReview,
  onClearResponse,
  hasResponse,
}) => {
  return (
    <div className="mt-8 flex items-center gap-3">
      <button
        onClick={onMarkForReview}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${isMarkedForReview
            ? 'border-[var(--color-warning-subtle)] bg-[var(--color-warning-subtle)] text-[var(--color-on-warning)]'
            : 'border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)]'
          }`}
      >
        <Flag className="h-4 w-4" weight={isMarkedForReview ? 'fill' : 'regular'} />
        {isMarkedForReview ? 'Marked' : 'Mark for review'}
      </button>

      <button
        onClick={onClearResponse}
        disabled={!hasResponse}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${hasResponse
            ? 'border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)]'
            : 'border-[var(--color-border-default)] bg-[rgba(255,255,255,0.01)] text-[var(--color-text-disabled)] cursor-not-allowed'
          }`}
      >
        <Eraser className="h-4 w-4" />
        Clear response
      </button>
    </div>
  )
}

export default QuestionActions
