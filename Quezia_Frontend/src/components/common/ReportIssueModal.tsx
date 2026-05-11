import React, { useState } from 'react'
import { X, CheckCircle } from '@phosphor-icons/react'

const ISSUE_TYPES = [
  { id: 'incorrect-answer', label: 'Incorrect answer' },
  { id: 'ambiguous', label: 'Ambiguous or unclear question' },
  { id: 'missing-data', label: 'Missing or wrong data' },
  { id: 'typo', label: 'Typo or formatting issue' },
  { id: 'out-of-syllabus', label: 'Question out of syllabus' },
  { id: 'other', label: 'Other' },
] as const

type IssueType = (typeof ISSUE_TYPES)[number]['id']

type Props = {
  isOpen: boolean
  onClose: () => void
  questionNumber: number
  questionId: number
  testId?: string
  section?: string
}

const ReportIssueModal: React.FC<Props> = ({
  isOpen,
  onClose,
  questionNumber,
  questionId,
  testId,
  section,
}) => {
  const [selectedIssue, setSelectedIssue] = useState<IssueType | null>(null)
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!selectedIssue) return

    const reportData = {
      issueType: selectedIssue,
      additionalInfo: additionalInfo.trim(),
      questionId,
      questionNumber,
      testId,
      section,
      timestamp: new Date().toISOString()
    }

    // TODO: Send report to backend with reportData
    console.log('Report data:', reportData)
    
    setIsSubmitted(true)

    // Close after brief confirmation
    setTimeout(() => {
      handleClose()
    }, 1500)
  }

  const handleClose = () => {
    // Reset state
    setSelectedIssue(null)
    setAdditionalInfo('')
    setIsSubmitted(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-neutral-900 overflow-hidden">
        {isSubmitted ? (
          /* Success state */
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <CheckCircle size={48} weight="fill" className="text-emerald-400 mb-4" />
            <p className="text-sm text-neutral-300 text-center">
              Thanks — we've received this and will review it.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-5 pb-0">
              <div>
                <h2 className="text-base font-medium text-neutral-100">
                  Report an issue with this question
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Your report helps us improve test accuracy for everyone.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1 -mr-1 -mt-1 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {/* Issue type selection */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-neutral-400 mb-3">
                  What's the issue?
                </label>
                <div className="space-y-2">
                  {ISSUE_TYPES.map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm text-left transition ${
                        selectedIssue === issue.id
                          ? 'border-white/20 bg-white/[0.08] text-neutral-200'
                          : 'border-white/5 bg-white/[0.02] text-neutral-400 hover:border-white/10 hover:text-neutral-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${
                          selectedIssue === issue.id
                            ? 'border-white bg-white'
                            : 'border-neutral-600'
                        }`}
                      >
                        {selectedIssue === issue.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
                        )}
                      </div>
                      {issue.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional additional info */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-neutral-400 mb-2">
                  Anything you'd like to add?{' '}
                  <span className="text-neutral-600">(optional)</span>
                </label>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="One line is enough if needed"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-white/5 bg-white/[0.02] text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-white/20 focus:outline-none resize-none"
                />
              </div>

              {/* Reassurance note */}
              <p className="text-[11px] text-neutral-500 leading-relaxed mb-5">
                Reports are reviewed by our academic team and help improve future tests.
                Your response here will not affect your score.
              </p>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-sm text-neutral-400 hover:text-neutral-300 hover:bg-white/[0.03] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedIssue}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    selectedIssue
                      ? 'bg-white text-neutral-900 hover:bg-neutral-200'
                      : 'bg-white/10 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  Submit report
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ReportIssueModal
