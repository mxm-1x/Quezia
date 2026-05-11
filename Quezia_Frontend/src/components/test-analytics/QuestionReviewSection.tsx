import React, { useState, useMemo } from 'react'
import QuestionNavigator from './QuestionNavigator'
import QuestionDetailView from './QuestionDetailView'

export interface QuestionReviewData {
    id: number
    section: string
    subject: string
    topic: string
    difficulty: 'easy' | 'medium' | 'hard'
    status: 'correct' | 'incorrect' | 'unattempted'
    marks: number
    time: number
    text: string
    options?: string[]
    userAnswer?: any
    correctAnswer?: any
    explanation?: string
}

interface Props {
    questions: QuestionReviewData[]
}

const QuestionReviewSection: React.FC<Props> = ({ questions }) => {
    const [activeIndex, setActiveIndex] = useState(0)
    const [filter, setFilter] = useState<'all' | 'incorrect' | 'unattempted' | 'hard' | 'slow'>('all')
    const [isMistakeOnly, setIsMistakeOnly] = useState(false)

    const filteredQuestions = useMemo(() => {
        let base = questions
        if (isMistakeOnly) {
            base = base.filter(q => q.status === 'incorrect')
        }

        return base.filter(q => {
            if (filter === 'incorrect') return q.status === 'incorrect'
            if (filter === 'unattempted') return q.status === 'unattempted'
            if (filter === 'hard') return q.difficulty === 'hard'
            if (filter === 'slow') return q.time > 120
            return true
        })
    }, [questions, filter, isMistakeOnly])

    const activeQuestion = filteredQuestions[activeIndex] || filteredQuestions[0]

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[700px]">
            {/* Left Pane: Navigator */}
            <div className="w-full lg:w-[35%] flex flex-col bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-3xl overflow-hidden">
                <div className="p-4 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col gap-0.5">
                            <h3 className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] leading-none">Question Debugger</h3>
                            <span className="text-[9px] font-bold text-[var(--color-text-disabled)] tracking-tighter">
                                {filteredQuestions.length} Items Found
                            </span>
                        </div>

                        <button
                            onClick={() => setIsMistakeOnly(!isMistakeOnly)}
                            className={`px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${isMistakeOnly
                                ? 'bg-[var(--color-error-subtle)] border-[var(--color-error-subtle)] text-[var(--color-error)] shadow-[0_0_12px_var(--color-error-subtle)]'
                                : 'bg-[var(--color-bg-subtle)] border-[var(--color-border-default)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                                }`}
                        >
                            Mistake Only
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        <FilterChip label="All" active={filter === 'all'} onClick={() => { setFilter('all'); setActiveIndex(0); }} />
                        <FilterChip label="Incorrect" active={filter === 'incorrect'} onClick={() => { setFilter('incorrect'); setActiveIndex(0); }} color="text-[var(--color-error)]" />
                        <FilterChip label="Missed" active={filter === 'unattempted'} onClick={() => { setFilter('unattempted'); setActiveIndex(0); }} />
                        <FilterChip label="Hard" active={filter === 'hard'} onClick={() => { setFilter('hard'); setActiveIndex(0); }} color="text-[var(--color-warning)]" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <QuestionNavigator
                        questions={filteredQuestions}
                        activeIndex={activeIndex}
                        onSelect={setActiveIndex}
                    />
                </div>
            </div>

            {/* Right Pane: Detail */}
            <div className="flex-1 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-3xl overflow-hidden flex flex-col">
                <QuestionDetailView question={activeQuestion} />
            </div>
        </div>
    )
}

const FilterChip = ({ label, active, onClick, color = 'text-[var(--color-text-tertiary)]' }: { label: string, active: boolean, onClick: () => void, color?: string }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${active
            ? 'bg-[var(--color-bg-muted)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] shadow-lg'
            : `${color} hover:bg-[var(--color-bg-subtle)] border border-transparent`
            }`}
    >
        {label}
    </button>
)

export default QuestionReviewSection
