import React from 'react'
import { Bug } from '@phosphor-icons/react'

type Props = {
  questionNumber: number
  totalQuestions: number
  marks: number
  onReportIssue: () => void
}

const QuestionHeader: React.FC<Props> = ({ questionNumber, totalQuestions, marks, onReportIssue }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">
          Question {questionNumber}
        </span>
        <span className="text-xs text-[var(--color-text-tertiary)]">
          of {totalQuestions}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-[var(--color-text-secondary)]">
          {marks} mark{marks !== 1 ? 's' : ''}
        </span>
        <button
          onClick={onReportIssue}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] transition-all text-xs"
          title="Report issue"
        >
          <Bug size={12} weight="bold" />
          <span>Report</span>
        </button>
      </div>
    </div>
  )
}

export default QuestionHeader
