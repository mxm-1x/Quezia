import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretRight } from '@phosphor-icons/react'

export type TestStatus = 'IN_PROGRESS' | 'COMPLETED' | 'GENERATED'

export type TestCardData = {
  id: string
  title: string
  subject: string
  status: TestStatus
  totalQuestions: number
  attemptedQuestions?: number
  score?: number
  totalMarks?: number
  createdAt: string
  lastInteractedAt: string
}

type Props = {
  test: TestCardData
}

const TestListCard: React.FC<Props> = ({ test }) => {
  const navigate = useNavigate()

  const statusColor = {
    IN_PROGRESS: 'bg-[var(--color-warning)]',
    COMPLETED: 'bg-[var(--color-success)]',
    GENERATED: 'bg-[var(--color-text-disabled)]',
  }[test.status]

  const formatDate = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleClick = () => {
    navigate(`/dashboard/tests/thread/${test.id}`)
  }

  // Right side value based on status
  const renderRightValue = () => {
    if (test.status === 'COMPLETED' && test.score !== undefined && test.totalMarks !== undefined) {
      return <span className="text-sm tabular-nums text-[var(--color-success)]">{test.score}/{test.totalMarks}</span>
    }
    if (test.status === 'IN_PROGRESS' && test.attemptedQuestions !== undefined) {
      return <span className="text-sm tabular-nums text-[var(--color-text-tertiary)]">{test.attemptedQuestions}/{test.totalQuestions}</span>
    }
    if (test.status === 'GENERATED' && test.totalMarks !== undefined) {
      return <span className="text-sm tabular-nums text-[var(--color-text-disabled)]">{test.totalMarks} marks</span>
    }
    return null
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-left group py-4 px-1 flex items-center gap-4 border-b border-[var(--color-border-default)] opacity-80 last:border-b-0 hover:bg-[var(--color-bg-subtle)] transition"
    >
      {/* Status dot */}
      <div className={`flex-shrink-0 w-2 h-2 rounded-full ${statusColor}`} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[15px] text-[var(--color-text-secondary)] truncate group-hover:text-[var(--color-text-primary)] transition">
          {test.title}
        </h3>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
          {test.subject} · {test.totalQuestions} questions · {formatDate(test.createdAt)}
        </p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {renderRightValue()}
        <CaretRight size={14} weight="bold" className="text-[var(--color-text-disabled)] group-hover:text-[var(--color-text-secondary)] transition" />
      </div>
    </button>
  )
}

export default TestListCard
