import React from 'react'
import QuestionHeader from '../question/QuestionHeader'
import QuestionText from '../question/QuestionText'
import AnswerInput from '../question/AnswerInput'
import NumericAnswerPanel from '../question/NumericAnswerPanel'
import QuestionActions from './QuestionActions'
import { type Question, type NumericQuestion } from '../../../../types/test'

// Re-export for backwards compatibility
export type SessionQuestion = Question

type Props = {
  question: Question
  questionNumber: number
  totalQuestions: number
  selectedAnswer: number | null
  numericAnswer: string
  isMarkedForReview: boolean
  onSelectAnswer: (index: number) => void
  onNumericChange: (value: string) => void
  onMarkForReview: () => void
  onClearResponse: () => void
  onReportIssue: () => void
}

const QuestionWorkspace: React.FC<Props> = ({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  numericAnswer,
  isMarkedForReview,
  onSelectAnswer,
  onNumericChange,
  onMarkForReview,
  onClearResponse,
  onReportIssue,
}) => {
  const hasResponse = question.type === 'mcq'
    ? selectedAnswer !== null
    : numericAnswer !== ''

  const isNumericQuestion = question.type === 'numeric'

  // Get numeric rules from question (if available)
  const numericRules = isNumericQuestion
    ? (question as NumericQuestion).numericRules ?? { allowDecimals: false, allowNegative: true }
    : undefined

  return (
    <>
      {/* Left panel - Numeric keypad for NAT questions (fixed position) */}
      {isNumericQuestion && (
        <NumericAnswerPanel
          value={numericAnswer}
          onChange={onNumericChange}
          rules={numericRules}
        />
      )}

      <main className="flex-1 flex h-full overflow-hidden">

        {/* Main content area */}
        <div className="flex-1 flex items-start justify-center overflow-y-auto py-8">
          <div className="w-full max-w-2xl px-6">
            <QuestionHeader
              questionNumber={questionNumber}
              totalQuestions={totalQuestions}
              marks={question.marks}
              onReportIssue={onReportIssue}
            />

            <QuestionText text={question.text} />

            {question.type === 'mcq' ? (
              <AnswerInput
                type="mcq"
                options={question.options}
                selectedIndex={selectedAnswer}
                onSelect={onSelectAnswer}
              />
            ) : (
              <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-4">
                {numericAnswer ? (
                  <p className="font-mono text-lg text-[var(--color-text-primary)]">{numericAnswer}</p>
                ) : (
                  <p className="font-mono text-lg text-[var(--color-text-tertiary)]">—</p>
                )}
              </div>
            )}

            <QuestionActions
              isMarkedForReview={isMarkedForReview}
              onMarkForReview={onMarkForReview}
              onClearResponse={onClearResponse}
              hasResponse={hasResponse}
            />
          </div>
        </div>
      </main>
    </>
  )
}

export default QuestionWorkspace
