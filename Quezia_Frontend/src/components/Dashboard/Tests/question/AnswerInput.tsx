import React from 'react'
import AnswerOption from './AnswerOption'

export type QuestionType = 'mcq' | 'numeric'

export type AnswerValue = number | string | null

type MCQProps = {
  type: 'mcq'
  options: (string | { key: string; text: string })[]
  selectedIndex: number | null
  onSelect: (index: number) => void
}

type NumericProps = {
  type: 'numeric'
  value: string
  onChange: (value: string) => void
  hint?: string
}

type Props = MCQProps | NumericProps

const AnswerInput: React.FC<Props> = (props) => {
  if (props.type === 'mcq') {
    return (
      <div className="space-y-3">
        {props.options?.map((option, index) => {
          const label = typeof option === 'string' ? String.fromCharCode(65 + index) : option.key
          const text = typeof option === 'string' ? option : option.text
          return (
            <AnswerOption
              key={index}
              label={label}
              text={text}
              isSelected={props.selectedIndex === index}
              onSelect={() => props.onSelect(index)}
            />
          )
        })}
        {!props.options && (
          <p className="text-sm text-[var(--color-text-tertiary)] italic">No options available for this question.</p>
        )}
      </div>
    )
  }

  // Numeric type
  return (
    <div className="space-y-2">
      <input
        type="text"
        inputMode="numeric"
        value={props.value}
        onChange={(e) => {
          // Allow only numbers, minus sign, and decimal point
          const val = e.target.value
          if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
            props.onChange(val)
          }
        }}
        placeholder="Enter your answer"
        className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-border-strong)] focus:bg-[var(--color-bg-muted)] focus:outline-none transition"
      />
      {props.hint && (
        <p className="text-xs text-[var(--color-text-tertiary)] px-1">{props.hint}</p>
      )}
    </div>
  )
}

export default AnswerInput
