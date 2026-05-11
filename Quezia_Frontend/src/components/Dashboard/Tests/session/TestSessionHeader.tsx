import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretLeft } from '@phosphor-icons/react'
import ConfirmModal from '../../../common/ConfirmModal'

export type TestStats = {
  total: number
  attempted: number
  unattempted: number
  markedForReview: number
}

type Props = {
  title: string
  subject?: string
  timeRemaining?: string
  stats: TestStats
  onSubmit: () => void
}

const TestSessionHeader: React.FC<Props> = ({ title, subject, timeRemaining, stats, onSubmit }) => {
  const navigate = useNavigate()
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  const handleLeave = () => {
    setShowLeaveModal(false)
    navigate(-1)
  }

  const handleConfirmSubmit = () => {
    setShowSubmitModal(false)
    onSubmit()
  }

  const submitDescription = (
    <div className="space-y-3">
      <p className="text-[var(--color-text-secondary)]">Are you sure you want to submit? You won't be able to change your answers after submission.</p>
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="rounded-lg border border-[var(--color-success-subtle)] bg-[var(--color-success-subtle)] px-3 py-2">
          <div className="text-lg font-semibold text-[var(--color-on-success)]">{stats.attempted}</div>
          <div className="text-xs text-[var(--color-text-tertiary)]">Attempted</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] px-3 py-2">
          <div className="text-lg font-semibold text-[var(--color-text-secondary)]">{stats.unattempted}</div>
          <div className="text-xs text-[var(--color-text-tertiary)]">Unattempted</div>
        </div>
        <div className="rounded-lg border border-[var(--color-warning-subtle)] bg-[var(--color-warning-subtle)] px-3 py-2">
          <div className="text-lg font-semibold text-[var(--color-on-warning)]">{stats.markedForReview}</div>
          <div className="text-xs text-[var(--color-text-tertiary)]">Marked for Review</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] px-3 py-2">
          <div className="text-lg font-semibold text-[var(--color-text-secondary)]">{stats.total}</div>
          <div className="text-xs text-[var(--color-text-tertiary)]">Total Questions</div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-[var(--color-border-default)] bg-[var(--color-bg-base)]">
        <div className="h-full max-w-screen-xl mx-auto px-6 flex items-center justify-between">
          {/* Left: Back + Test context */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLeaveModal(true)}
              className="p-1.5 -ml-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition"
              title="Leave test"
            >
              <CaretLeft size={18} weight="bold" />
            </button>
            <h1 className="text-sm font-medium text-[var(--color-text-primary)]">
              {title}
            </h1>
            {subject && (
              <>
                <span className="text-[var(--color-text-disabled)]">·</span>
                <span className="text-sm text-[var(--color-text-secondary)]">{subject}</span>
              </>
            )}
          </div>

          {/* Right: Timer + Submit */}
          <div className="flex items-center gap-4">
            {timeRemaining && (
              <div className="text-sm font-mono text-[var(--color-text-secondary)]">
                {timeRemaining}
              </div>
            )}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="rounded-lg bg-[var(--color-text-primary)] px-4 py-2 text-sm font-medium text-[var(--color-bg-base)] hover:bg-[var(--color-action-primary-hover)] transition"
            >
              Submit Test
            </button>
          </div>
        </div>
      </header>

      {/* Leave Modal */}
      <ConfirmModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Leave Test?"
        description="You can rejoin anytime, but the timer will keep running. If the test ends while you're away, it will be auto-submitted and recorded."
        cancelButton={{
          label: 'Stay',
          onClick: () => setShowLeaveModal(false),
        }}
        confirmButton={{
          label: 'Leave',
          onClick: handleLeave,
          variant: 'danger',
        }}
      />

      {/* Submit Confirmation Modal */}
      <ConfirmModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Test?"
        description={submitDescription}
        cancelButton={{
          label: 'Review Again',
          onClick: () => setShowSubmitModal(false),
        }}
        confirmButton={{
          label: 'Submit',
          onClick: handleConfirmSubmit,
          variant: 'primary',
        }}
      />
    </>
  )
}

export default TestSessionHeader
