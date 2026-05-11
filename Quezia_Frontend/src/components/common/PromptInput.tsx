import React, { useRef } from 'react'
import { BookOpen, Gauge, PaperPlane } from '@phosphor-icons/react'
import { PillDropdown, type DropdownOption } from './Dropdown'
import LoadingSpinner from './LoadingSpinner'

const subjectOptions: DropdownOption[] = [
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'mathematics', label: 'Mathematics' },
]

const difficultyOptions: DropdownOption[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

interface PromptInputProps {
  selectedSubject: string[]
  setSelectedSubject: (subjects: string[]) => void
  selectedDifficulty: string
  setSelectedDifficulty: (difficulty: string) => void
  isSubjectOpen: boolean
  setIsSubjectOpen: (open: boolean) => void
  isDifficultyOpen: boolean
  setIsDifficultyOpen: (open: boolean) => void
  openUp?: boolean
  placeholder?: string
  onSubmit?: (prompt: string) => void
  isLoading?: boolean
}

const PromptInput: React.FC<PromptInputProps> = ({
  selectedSubject,
  setSelectedSubject,
  selectedDifficulty,
  setSelectedDifficulty,
  isSubjectOpen,
  setIsSubjectOpen,
  isDifficultyOpen,
  setIsDifficultyOpen,
  openUp = false,
  placeholder = 'What would you like to practice today?',
  onSubmit,
  isLoading = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleTextareaInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit && textareaRef.current?.value.trim()) {
      onSubmit(textareaRef.current.value.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Chat / prompt */}
      <div className="mb-3 rounded-xl bg-[var(--color-bg-subtle)] px-5 py-3">
        <textarea
          ref={textareaRef}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full resize-none bg-transparent text-[var(--color-text-secondary)] placeholder-[var(--color-text-disabled)] outline-none max-h-32 disabled:opacity-50"
          onInput={handleTextareaInput}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
      </div>

      {/* Action buttons row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Subject Dropdown */}
          <PillDropdown
            multiSelect
            options={subjectOptions}
            value={selectedSubject}
            onChange={setSelectedSubject}
            isOpen={isSubjectOpen}
            setIsOpen={(open) => {
              setIsSubjectOpen(open)
              if (open) setIsDifficultyOpen(false)
            }}
            icon={<BookOpen size={16} className="text-[var(--color-text-tertiary)]" />}
            placeholder="Subject"
            openUp={openUp}
          />

          {/* Difficulty Dropdown */}
          <PillDropdown
            options={difficultyOptions}
            value={selectedDifficulty}
            onChange={setSelectedDifficulty}
            isOpen={isDifficultyOpen}
            setIsOpen={(open) => {
              setIsDifficultyOpen(open)
              if (open) setIsSubjectOpen(false)
            }}
            icon={<Gauge size={16} className="text-[var(--color-text-tertiary)]" />}
            placeholder="Difficulty"
            openUp={openUp}
          />
        </div>
        {/* Send button */}
        <button
          type="submit"
          disabled={isLoading}
          className="group flex items-center justify-center h-10 w-10 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)] focus:outline-none disabled:opacity-50"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <PaperPlane className="h-4 w-4 rotate-90 transition-transform" />
          )}
        </button>
      </div>
    </form>
  )
}


export default PromptInput