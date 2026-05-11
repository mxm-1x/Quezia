import React from 'react'
import { ArrowsClockwise } from '@phosphor-icons/react'

export type Question = {
  id: number
  text: string
  marks: number
  options?: (string | { key: string; text: string })[]
}

type Props = {
  question: Question
  onRegenerate?: (id: number) => void
}

const QuestionPreviewCard: React.FC<Props> = ({ question, onRegenerate }) => {
  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-4">
        <p className="text-sm text-neutral-200 leading-relaxed">
          <span className="text-neutral-400 mr-2">Q{question.id}.</span>
          {question.text}
        </p>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 whitespace-nowrap">
            {question.marks} mark{question.marks > 1 ? 's' : ''}
          </span>
          <button
            onClick={() => onRegenerate?.(question.id)}
            className="rounded-md p-1 text-neutral-400 hover:bg-white/10 hover:text-neutral-200"
            title="Regenerate question"
          >
            <ArrowsClockwise className="h-4 w-4" />
          </button>
        </div>
      </div>

      {question.options && question.options.length > 0 ? (
        <div className="space-y-2 pl-6">
          {question.options.map((opt, i) => {
            const displayOption = typeof opt === 'string' ? opt : opt.text
            return (
              <div
                key={i}
                className="rounded-lg border border-white/5 bg-white/[0.03] px-4 py-2 text-sm text-neutral-300"
              >
                {String.fromCharCode(97 + i)}) {displayOption}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="pl-6">
          <div className="rounded-lg border border-white/5 bg-white/[0.03] px-4 py-2 text-sm text-neutral-400 italic">
            Numerical answer required
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionPreviewCard
