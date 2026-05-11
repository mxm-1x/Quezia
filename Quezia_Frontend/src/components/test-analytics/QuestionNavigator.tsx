import React from 'react'

interface QuestionReviewData {
    id: number
    status: 'correct' | 'incorrect' | 'unattempted'
    marks: number
    time: number
    topic: string
}

interface Props {
    questions: QuestionReviewData[]
    activeIndex: number
    onSelect: (index: number) => void
}

const QuestionNavigator: React.FC<Props> = ({ questions, activeIndex, onSelect }) => {
    return (
        <div className="divide-y divide-[var(--color-border-default)]">
            {questions.map((q, index) => (
                <button
                    key={q.id}
                    onClick={() => onSelect(index)}
                    className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-all ${activeIndex === index
                        ? 'bg-[var(--color-bg-muted)] border-l-2 border-[var(--color-accent)]'
                        : 'hover:bg-[var(--color-bg-subtle)] border-l-2 border-transparent'
                        }`}
                >
                    <div className="w-8 text-xs font-mono font-bold text-[var(--color-text-disabled)]">
                        #{String(q.id).padStart(2, '0')}
                    </div>

                    <div className={`w-2 h-2 rounded-full ${q.status === 'correct' ? 'bg-[var(--color-success)] shadow-[0_0_8px_var(--color-success-subtle)]' :
                        q.status === 'incorrect' ? 'bg-[var(--color-error)] shadow-[0_0_8px_var(--color-error-subtle)]' :
                            'text-[var(--color-text-disabled)] bg-current'
                        }`} />

                    <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-bold truncate ${activeIndex === index ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                            {q.topic}
                        </p>
                        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-tighter text-[var(--color-text-tertiary)] mt-0.5">
                            <span>{q.time}s</span>
                            <span>•</span>
                            <span className={q.marks > 0 ? 'text-[var(--color-success)] opacity-60' : q.marks < 0 ? 'text-[var(--color-error)] opacity-60' : ''}>
                                {q.marks > 0 ? `+${q.marks}` : q.marks}m
                            </span>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    )
}

export default QuestionNavigator
