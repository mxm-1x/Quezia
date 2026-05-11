import React, { useState, useMemo, useCallback } from 'react'
import { X } from '@phosphor-icons/react'
import QuestionLegend, { type QuestionStatus } from './QuestionLegend'
import type { Section } from '../../../../types/test'

type QuestionState = {
  id: number
  status: QuestionStatus
  section?: string
}

type Props = {
  questions: QuestionState[]
  sections?: Section[]
  currentIndex: number
  onSelect: (index: number) => void
  onClose: () => void
  isOpen: boolean
}

const statusStyles: Record<QuestionStatus, string> = {
  unattempted: 'border-[var(--color-border-default)] bg-transparent text-[var(--color-text-tertiary)]',
  attempted: 'border-[var(--color-success-subtle)] bg-[var(--color-success-subtle)] text-[var(--color-on-success)]',
  marked: 'border-[var(--color-warning-subtle)] bg-[var(--color-warning-subtle)] text-[var(--color-on-warning)]',
  current: 'border-[var(--color-border-strong)] bg-[var(--color-bg-muted)] text-[var(--color-text-primary)]',
}

const QuestionPalette: React.FC<Props> = ({ questions, sections, currentIndex, onSelect, onClose, isOpen }) => {
  // Track user override: { section: string, fromIndex: number } or null
  // The override is valid only if current question is still in the section it was when override was made
  const [userOverride, setUserOverride] = useState<{ section: string; fromSection: string } | null>(null)

  // Determine section based on question index
  const getSectionForIndex = useCallback((index: number): string => {
    if (!sections || sections.length === 0) return ''
    const section = sections.find((s) => index >= s.startIndex && index <= s.endIndex)
    return section?.id || sections[0].id
  }, [sections])

  // Current question's natural section
  const currentQuestionSection = getSectionForIndex(currentIndex)

  // Active section: use override if it's still valid, otherwise follow current question
  const activeSection = useMemo(() => {
    // Override is valid only if we haven't navigated to a different section
    if (userOverride && userOverride.fromSection === currentQuestionSection) {
      return userOverride.section
    }
    return currentQuestionSection
  }, [userOverride, currentQuestionSection])

  // Handle manual section selection
  const handleSectionClick = (sectionId: string) => {
    if (sectionId !== currentQuestionSection) {
      setUserOverride({ section: sectionId, fromSection: currentQuestionSection })
    } else {
      setUserOverride(null) // Clicking on current section clears override
    }
  }

  // Filter questions by active section
  const filteredQuestions = useMemo(() => {
    if (!sections || sections.length === 0) {
      return questions.map((q, i) => ({ ...q, globalIndex: i }))
    }
    const section = sections.find((s) => s.id === activeSection)
    if (!section) return questions.map((q, i) => ({ ...q, globalIndex: i }))

    return questions
      .map((q, i) => ({ ...q, globalIndex: i }))
      .filter((_, i) => i >= section.startIndex && i <= section.endIndex)
  }, [questions, sections, activeSection])

  // Calculate counts for current section
  const sectionCounts = useMemo(() => {
    return {
      unattempted: filteredQuestions.filter((q) => q.status === 'unattempted').length,
      attempted: filteredQuestions.filter((q) => q.status === 'attempted').length,
      marked: filteredQuestions.filter((q) => q.status === 'marked').length,
    }
  }, [filteredQuestions])

  // Overall counts for badge
  const totalCounts = useMemo(() => ({
    unattempted: questions.filter((q) => q.status === 'unattempted').length,
    attempted: questions.filter((q) => q.status === 'attempted').length,
    marked: questions.filter((q) => q.status === 'marked').length,
  }), [questions])

  return (
    <>
      {/* Right-side drawer - fixed position, slides in from right */}
      <div
        className={`fixed top-14 bottom-16 right-0 w-80 border-l border-[var(--color-border-default)] bg-[var(--color-bg-base)] z-40 transition-transform duration-200 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
            <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
              Questions
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-[var(--color-bg-subtle)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Section Tabs */}
          {sections && sections.length > 0 && (
            <div className="flex-shrink-0 px-2 pb-3">
              <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-bg-subtle)]">
                {sections.map((section) => {
                  const isActive = activeSection === section.id
                  const sectionQuestions = questions.slice(section.startIndex, section.endIndex + 1)
                  const attemptedInSection = sectionQuestions.filter((q) => q.status === 'attempted').length
                  const totalInSection = section.endIndex - section.startIndex + 1

                  return (
                    <button
                      key={section.id}
                      onClick={() => handleSectionClick(section.id)}
                      className={`flex-1 flex flex-col items-center gap-0.5 px-2 py-2 rounded-md text-xs transition ${isActive
                          ? 'bg-[var(--color-bg-muted)] text-[var(--color-text-primary)]'
                          : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]'
                        }`}
                    >
                      <span className="font-medium truncate max-w-full">{section.name}</span>
                      <span className={`text-[10px] ${isActive ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-disabled)]'}`}>
                        {attemptedInSection}/{totalInSection}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Grid - scrollable */}
          <div className="flex-1 overflow-y-auto px-4 mb-2">
            <div className="grid grid-cols-5 p-1 gap-2">
              {filteredQuestions.map((q) => {
                const isCurrent = q.globalIndex === currentIndex
                const displayStatus = isCurrent ? 'current' : q.status

                return (
                  <button
                    key={q.id}
                    onClick={() => onSelect(q.globalIndex)}
                    className={`aspect-square rounded-lg border text-xs font-medium transition hover:scale-105 ${statusStyles[displayStatus]}`}
                  >
                    {q.globalIndex + 1}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Legend - fixed at bottom */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-[var(--color-border-default)]">
            <div className="text-[10px] text-[var(--color-text-tertiary)] mb-2 uppercase tracking-wide">
              {sections && sections.length > 0
                ? `${sections.find(s => s.id === activeSection)?.name || 'Section'} Status`
                : 'Status'
              }
            </div>
            <QuestionLegend
              items={[
                { status: 'unattempted', label: 'Unattempted', count: sectionCounts.unattempted },
                { status: 'attempted', label: 'Attempted', count: sectionCounts.attempted },
                { status: 'marked', label: 'Marked', count: sectionCounts.marked },
              ]}
              compact
            />
            {sections && sections.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border-default)]">
                <div className="text-[10px] text-[var(--color-text-tertiary)] mb-2 uppercase tracking-wide">Overall</div>
                <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                  <span>{totalCounts.attempted}/{questions.length} answered</span>
                  {totalCounts.marked > 0 && (
                    <span className="text-[var(--color-on-warning)]">{totalCounts.marked} marked</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default QuestionPalette
