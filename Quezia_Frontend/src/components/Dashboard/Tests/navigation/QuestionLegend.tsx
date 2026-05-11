import React from 'react'

export type QuestionStatus = 'unattempted' | 'attempted' | 'marked' | 'current'

type LegendItem = {
  status: QuestionStatus
  label: string
  count: number
}

type Props = {
  items: LegendItem[]
  compact?: boolean
}

const statusStyles: Record<QuestionStatus, string> = {
  unattempted: 'border-[var(--color-border-default)] bg-transparent',
  attempted: 'border-[var(--color-success-subtle)] bg-[var(--color-success-subtle)]',
  marked: 'border-[var(--color-warning-subtle)] bg-[var(--color-warning-subtle)]',
  current: 'border-[var(--color-border-strong)] bg-[var(--color-bg-muted)]',
}

const QuestionLegend: React.FC<Props> = ({ items, compact }) => {
  return (
    <div className={compact ? 'flex flex-col gap-2' : 'flex items-center gap-4'}>
      {items.map((item) => (
        <div key={item.status} className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded border ${statusStyles[item.status]}`}
          />
          <span className="text-xs text-[var(--color-text-secondary)]">
            {item.label} ({item.count})
          </span>
        </div>
      ))}
    </div>
  )
}

export default QuestionLegend
