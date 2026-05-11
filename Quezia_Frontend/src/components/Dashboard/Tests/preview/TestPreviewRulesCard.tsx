import React, { useState } from 'react'
import { PencilSimple, Check } from '@phosphor-icons/react'
import { parseDuration, formatDuration } from '../../../../types/test'

export type TestInstructionsPreset = {
  title: string
  subtitle?: string
  duration: string
  sections?: string[]
  marking: {
    correct: string
    incorrect: string
    unattempted: string
  }
  rules: string[]
  queziaNote?: string
}

type Props = {
  preset: TestInstructionsPreset
  questionsCount?: number
  onStart: () => void
  onDurationChange?: (minutes: number) => void
  mock?: boolean
}

const TestPreviewRulesCard: React.FC<Props> = ({ preset, questionsCount, onStart, onDurationChange, mock = false }) => {
  const [isEditingDuration, setIsEditingDuration] = useState(false)
  const [durationMinutes, setDurationMinutes] = useState(() => parseDuration(preset.duration))
  const [durationInput, setDurationInput] = useState(preset.duration)

  const handleDurationSave = () => {
    const minutes = parseDuration(durationInput)
    setDurationMinutes(minutes)
    onDurationChange?.(minutes)
    setIsEditingDuration(false)
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] backdrop-blur px-6 py-5">

      {/* TITLE */}
      <div className="mb-4">
        <p className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">
          {mock ? 'Mock test' : 'Custom test'}
        </p>
        <h2 className="mt-1 text-base font-medium text-[var(--color-text-primary)]">
          {preset.title}
        </h2>
        {preset.subtitle && (
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
            {preset.subtitle}
          </p>
        )}
      </div>

      {/* META */}
      <div className="mb-4 flex items-center justify-between text-sm">
        <div>
          <p className="text-[var(--color-text-tertiary)]">Duration</p>
          {mock ? (
            <p className="text-[var(--color-text-primary)]">{formatDuration(durationMinutes)}</p>
          ) : (
            <div className="flex items-center gap-2">
              {isEditingDuration ? (
                <>
                  <input
                    type="text"
                    value={durationInput}
                    onChange={(e) => setDurationInput(e.target.value)}
                    className="w-20 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] px-2 py-1 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-border-strong)]"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleDurationSave()}
                  />
                  <button
                    onClick={handleDurationSave}
                    className="rounded-md p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[var(--color-text-primary)]">{formatDuration(durationMinutes)}</p>
                  <button
                    onClick={() => setIsEditingDuration(true)}
                    className="rounded-md p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]"
                  >
                    <PencilSimple className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {questionsCount !== undefined && (
          <div>
            <p className="text-[var(--color-text-tertiary)]">Questions</p>
            <p className="text-[var(--color-text-primary)]">{questionsCount}</p>
          </div>
        )}
        {preset.sections && preset.sections.length > 0 && (
          <div className="text-right">
            <p className="text-[var(--color-text-tertiary)]">Sections</p>
            <p className="text-[var(--color-text-primary)]">
              {preset.sections.length}
            </p>
          </div>
        )}
      </div>

      {/* RULES (compact) */}
      <ul className="mb-4 space-y-2 text-sm text-[var(--color-text-secondary)]">
        {preset.rules.slice(0, 5).map((rule, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-[var(--color-text-tertiary)]">•</span>
            <span>{rule}</span>
          </li>
        ))}
      </ul>

      {/* QUEZIA NOTE */}
      {preset.queziaNote && (
        <p className="mb-4 text-xs text-[var(--color-text-tertiary)]">
          {preset.queziaNote}
        </p>
      )}

      {/* CTA */}
      <button
        onClick={onStart}
        className="w-full rounded-xl bg-[var(--color-text-primary)] py-2.5 text-sm font-medium text-[var(--color-bg-base)] hover:bg-[var(--color-action-primary-hover)] transition"
      >
        Start Test
      </button>
    </div>
  )
}

export default TestPreviewRulesCard
