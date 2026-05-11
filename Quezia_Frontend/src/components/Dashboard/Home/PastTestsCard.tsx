import React from 'react'

export type PastTestStatus =
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'GENERATED'

interface PastTestCardProps {
  id: string

  title: string
  subject: string
  exam: string

  status: PastTestStatus

  totalQuestions: number
  attemptedQuestions?: number

  score?: number            // only for COMPLETED
  accuracy?: number         // only for COMPLETED

  lastInteractedAt: string  // ISO string

  onOpen: (testId: string) => void
}

const PastTestCard: React.FC<PastTestCardProps> = ({
  id,
  title,
  subject,
  exam,
  status,
  totalQuestions,
  attemptedQuestions = 0,
  score,
  accuracy,
  lastInteractedAt,
  onOpen,
}) => {
  /* ---------- derived UI ---------- */

  const statusConfig = {
    IN_PROGRESS: {
      label: 'In progress',
      color: 'text-emerald-400',
      cta: 'Continue test',
      metaRight: `${attemptedQuestions} / ${totalQuestions}`,
    },
    COMPLETED: {
      label: 'Completed',
      color: 'text-sky-400',
      cta: 'Review test',
      metaRight: score !== undefined ? `${score}%` : null,
    },
    GENERATED: {
      label: 'Not started',
      color: 'text-neutral-400',
      cta: 'Start test',
      metaRight: `${totalQuestions} Q`,
    },
  }[status]

  // Use useState to initialize a stable 'now' value to satisfy purity rules
  const [now] = React.useState(() => Date.now())

  const timeAgo = (iso: string) => {
    const diff = now - new Date(iso).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div
      className="
    min-w-[260px]
    h-[230px]
    shrink-0
    rounded-2xl
    bg-gradient-to-b from-white/[0.045] to-white/[0.02]
    p-5
    flex flex-col
    transition-all duration-200
    hover:-translate-y-1
  "
    >
      {/* TOP CONTENT */}
      <div>
        {/* STATUS ROW */}
        <div className="mb-2 flex items-center justify-between">
          <span className={`text-xs font-medium ${statusConfig.color}`}>
            {statusConfig.label}
          </span>

          {statusConfig.metaRight && (
            <span className="text-xs text-neutral-500">
              {statusConfig.metaRight}
            </span>
          )}
        </div>

        {/* TITLE */}
        <p className="text-sm font-medium text-white leading-snug">
          {title}
        </p>

        {/* META */}
        <div className="mt-3 space-y-1 text-xs text-neutral-400">
          <p>{subject} · {exam}</p>
          <p>Last active {timeAgo(lastInteractedAt)}</p>

          {status === 'COMPLETED' && accuracy !== undefined && (
            <p>Accuracy {accuracy}%</p>
          )}
        </div>
      </div>

      {/* CTA — ALWAYS AT BOTTOM */}
      <button
        onClick={() => onOpen(id)}
        className="
      mt-auto
      w-full
      rounded-lg
      bg-white/[0.06]
      py-2
      text-sm
      text-white
      transition
      hover:bg-white/[0.1]
    "
      >
        {statusConfig.cta}
      </button>
    </div>

  )
}

export default PastTestCard
