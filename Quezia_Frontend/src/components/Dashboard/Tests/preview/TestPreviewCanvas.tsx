import React, { useState, useRef, useEffect } from 'react'
import { Bug, CaretDown, ArrowsOut, ArrowsIn } from '@phosphor-icons/react'
import QuestionPreviewCard, { type Question } from './QuestionPreviewCard'
import ReportIssueModal from '../../../common/ReportIssueModal'

export type Version = {
  id: string
  label: string
  createdAt: string
}

type Props = {
  prompt: string
  versions: Version[]
  questions: Question[]
  currentVersion?: string
  onVersionChange?: (versionId: string) => void
  onStartTest: () => void
  onRegenerateQuestion?: (id: number) => void
  testId?: string
}

const TestPreviewCanvas: React.FC<Props> = ({
  prompt,
  versions,
  questions,
  currentVersion,
  onVersionChange,
  onStartTest,
  onRegenerateQuestion,
  testId,
}) => {
  const [isVersionOpen, setIsVersionOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportingQuestionId, setReportingQuestionId] = useState<number | null>(null)
  const versionRef = useRef<HTMLDivElement>(null)

  const selectedVersion = currentVersion || versions[0]?.label || 'v1'

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (versionRef.current && !versionRef.current.contains(e.target as Node)) {
        setIsVersionOpen(false)
      }
    }

    if (isVersionOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVersionOpen])

  return (
    <>
      <div className={`${isExpanded
        ? 'fixed inset-0 z-50 rounded-none'
        : 'relative flex-1 rounded-2xl mb-4'
        } border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] backdrop-blur p-6 flex flex-col overflow-hidden`}>

        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--color-border-default)]">
          {/* Prompt text */}
          <div className="flex-1 min-w-0 max-w-[70%]">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
              Generated from prompt
            </p>
            <div className="max-h-12 overflow-y-auto scrollbar-none">
              <p className="text-sm font-medium text-[var(--color-text-primary)] leading-snug">
                {prompt}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Expand/Shrink */}
            <button
              onClick={() => setIsExpanded((e) => !e)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-muted)] transition"
              title={isExpanded ? 'Shrink' : 'Expand'}
            >
              {isExpanded ? <ArrowsIn className="h-4 w-4" /> : <ArrowsOut className="h-4 w-4" />}
            </button>

            {/* Bug report */}
            <button
              onClick={() => {
                setReportingQuestionId(questions[0]?.id ?? 1)
                setIsReportModalOpen(true)
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-muted)] transition"
              title="Report issue"
            >
              <Bug className="h-4 w-4" />
            </button>

            {/* Version dropdown */}
            <div className="relative" ref={versionRef}>
              <button
                onClick={() => setIsVersionOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] transition"
              >
                {selectedVersion}
                <CaretDown className="h-3 w-3 text-[var(--color-text-tertiary)]" />
              </button>

              {isVersionOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] backdrop-blur-md p-1 z-20">
                  {versions.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        onVersionChange?.(v.id)
                        setIsVersionOpen(false)
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] transition"
                    >
                      <span>{v.label}</span>
                      <span className="text-xs text-[var(--color-text-tertiary)]">
                        {v.createdAt}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* QUESTIONS */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-8 scrollbar-none">
          {questions.map((q) => (
            <QuestionPreviewCard
              key={q.id}
              question={q}
              onRegenerate={onRegenerateQuestion}
            />
          ))}
        </div>

        {/* BOTTOM GRADIENT */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--color-bg-surface)] to-transparent" />

        {/* START TEST */}
        <div className="absolute bottom-4 right-4">
          <button
            onClick={onStartTest}
            className="rounded-xl bg-[var(--color-text-primary)] px-5 py-2.5 text-sm font-medium text-[var(--color-bg-base)] hover:bg-[var(--color-action-primary-hover)] transition"
          >
            Start Test
          </button>
        </div>
      </div>

      {/* Report Issue Modal - outside card for full-page overlay */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        questionNumber={reportingQuestionId ?? 1}
        questionId={reportingQuestionId ?? 1}
        testId={testId}
      />
    </>
  )
}

export default TestPreviewCanvas
