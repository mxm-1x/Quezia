import React from 'react'

type Props = {
  label: string
  text: string
  isSelected: boolean
  onSelect: () => void
}

const AnswerOption: React.FC<Props> = ({ label, text, isSelected, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-lg border px-4 py-3 transition ${isSelected
          ? 'border-[var(--color-border-strong)] bg-[var(--color-bg-muted)] text-[var(--color-text-primary)]'
          : 'border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-muted)]'
        }`}
    >
      <span className="mr-3 text-[var(--color-text-tertiary)]">{label})</span>
      {text}
    </button>
  )
}

export default AnswerOption
