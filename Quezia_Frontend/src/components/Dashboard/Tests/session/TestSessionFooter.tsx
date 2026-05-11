import React from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'

type Props = {
  currentQuestion: number
  totalQuestions: number
  onPrevious: () => void
  onNext: () => void
  onTogglePalette: () => void
  canGoPrevious: boolean
  canGoNext: boolean
  isPaletteOpen: boolean
}

const TestSessionFooter: React.FC<Props> = ({
  currentQuestion,
  totalQuestions,
  onPrevious,
  onNext,
  onTogglePalette,
  canGoPrevious,
  canGoNext,
}) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-[var(--color-border-default)] bg-[var(--color-bg-base)]">
      <div className="h-full max-w-screen-xl mx-auto px-6 flex items-center justify-between">
        {/* Previous */}
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${canGoPrevious
              ? 'border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]'
              : 'border-[var(--color-border-default)] text-[var(--color-text-disabled)] cursor-not-allowed'
            }`}
        >
          <CaretLeft className="h-4 w-4" />
          Previous
        </button>

        {/* Center: Question position indicator */}
        <button
          onClick={onTogglePalette}
          className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition"
        >
          {currentQuestion} / {totalQuestions}
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${canGoNext
              ? 'border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]'
              : 'border-[var(--color-border-default)] text-[var(--color-text-disabled)] cursor-not-allowed'
            }`}
        >
          Next
          <CaretRight className="h-4 w-4" />
        </button>
      </div>
    </footer>
  )
}

export default TestSessionFooter
