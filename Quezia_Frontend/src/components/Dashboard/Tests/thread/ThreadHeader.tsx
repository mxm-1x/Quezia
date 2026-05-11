import React, { useState, useRef, useEffect } from 'react'
import { ChartBar, Trash } from '@phosphor-icons/react'
import AttemptsAnalyticsPopup, { type Attempt } from '../analytics/AttemptsAnalyticsPopup'

type Props = {
  threadId: string
  title?: string
  attempts: Attempt[]
  onStartTest: () => void
  onDelete?: () => void
  showDelete?: boolean
}

const ThreadHeader: React.FC<Props> = ({
  threadId,
  title,
  attempts,
  onStartTest,
  onDelete,
  showDelete
}) => {
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsAnalyticsOpen(false)
      }
    }
    if (isAnalyticsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isAnalyticsOpen])

  return (
    <div className="mb-4 flex items-center justify-between" ref={containerRef}>
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Test thread
        </p>
        <h1 className="mt-1 text-lg font-medium text-[var(--color-text-primary)]">
          {title || `Thread #${threadId}`}
        </h1>
      </div>

      <div className="flex items-center gap-3 relative">
        {showDelete && (
          <button
            onClick={onDelete}
            className="flex items-center justify-center p-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-error)] hover:text-white transition-all group"
            title="Delete thread"
          >
            <Trash size={18} />
          </button>
        )}

        <button
          onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${isAnalyticsOpen
            ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-base)] shadow-[var(--shadow-md)]'
            : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-default)]'
            }`}
        >
          <ChartBar size={18} weight={isAnalyticsOpen ? "fill" : "regular"} />
          <span>Analytics</span>
        </button>

        {isAnalyticsOpen && (
          <AttemptsAnalyticsPopup
            testId={threadId}
            attempts={attempts}
            onStartTest={onStartTest}
            onClose={() => setIsAnalyticsOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

export default ThreadHeader
