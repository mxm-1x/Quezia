import React from 'react'
import { CheckCircle, WarningCircle, Clock, Tag, TrendUp, ChartBar } from '@phosphor-icons/react'
import type { QuestionReviewData } from './QuestionReviewSection'

interface Props {
    question?: QuestionReviewData
}

const QuestionDetailView: React.FC<Props> = ({ question }) => {
    if (!question) {
        return (
            <div className="flex-1 flex items-center justify-center text-[var(--color-text-disabled)]">
                <p className="text-sm font-medium">Select a question to debug</p>
            </div>
        )
    }

    const {
        text,
        options,
        userAnswer,
        correctAnswer,
        status,
        difficulty,
        topic,
        time,
        marks,
        explanation
    } = question

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header / Meta */}
            <div className="bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <StatusBadge status={status} />
                    <div className="h-4 w-px bg-[var(--color-border-default)]" />
                    <div className="flex items-center gap-4">
                        <MetaItem icon={<Tag size={12} />} label="Topic" value={topic} />
                        <MetaItem icon={<TrendUp size={12} />} label="Difficulty" value={difficulty} color={
                            difficulty === 'easy' ? 'text-[var(--color-success)]' :
                                difficulty === 'medium' ? 'text-[var(--color-warning)]' : 'text-[var(--color-error)]'
                        } />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <MetaItem icon={<Clock size={12} />} label="Time Spent" value={`${time}s`} color={time > 120 ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-primary)]'} />
                    <MetaItem icon={<ChartBar size={12} />} label="Marks" value={marks > 0 ? `+${marks}` : marks.toString()} color={
                        marks > 0 ? 'text-[var(--color-success)]' : marks < 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-disabled)]'
                    } />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {/* Question */}
                <div className="space-y-4">
                    <p className="text-lg font-medium text-[var(--color-text-secondary)] leading-relaxed">
                        {text}
                    </p>
                </div>

                {/* Options */}
                {options && (
                    <div className="space-y-3 max-w-2xl">
                        {options.map((opt, idx) => {
                            const optionKey = String.fromCharCode(65 + idx) // A, B, C, D…
                            const isUserSelection = userAnswer != null && (String(userAnswer).toUpperCase() === optionKey || userAnswer === idx)
                            const isCorrect = correctAnswer != null && (String(correctAnswer).toUpperCase() === optionKey || correctAnswer === idx)

                            let borderClass = 'border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]'
                            let labelClass = 'bg-[var(--color-bg-muted)] text-[var(--color-text-disabled)]'

                            if (isCorrect) {
                                borderClass = 'border-[var(--color-success)]/50 bg-[var(--color-success-subtle)]'
                                labelClass = 'bg-[var(--color-success)] text-[var(--color-text-on-color)]'
                            } else if (isUserSelection && !isCorrect) {
                                borderClass = 'border-[var(--color-error)]/50 bg-[var(--color-error-subtle)]'
                                labelClass = 'bg-[var(--color-error)] text-[var(--color-text-on-color)]'
                            }

                            return (
                                <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${borderClass}`}>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${labelClass}`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">{opt}</span>

                                    <div className="ml-auto flex items-center gap-3">
                                        {isCorrect && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--color-success-subtle)] border border-[var(--color-success)]/20">
                                                <span className="text-[9px] font-black text-[var(--color-on-success)] uppercase tracking-widest leading-none">Correct</span>

                                            </div>
                                        )}
                                        {isUserSelection && !isCorrect && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--color-error-subtle)] border border-[var(--color-error)]/20">
                                                <span className="text-[9px] font-black text-[var(--color-on-error)] uppercase tracking-widest leading-none">Your Selection</span>
                                                <WarningCircle size={14} weight="fill" className="text-[var(--color-on-error)]" />
                                            </div>
                                        )}
                                        {isUserSelection && isCorrect && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--color-success-subtle)] border border-[var(--color-success)]/30">
                                                <span className="text-[9px] font-black text-[var(--color-on-success)] uppercase tracking-widest leading-none">Your Selection</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Numeric Comparison Block */}
                {!options && (userAnswer !== undefined || correctAnswer !== undefined) && (
                    <div className="max-w-2xl grid grid-cols-2 gap-6">
                        <div className="p-6 bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded-2xl">
                            <h4 className="text-[9px] font-black text-[var(--color-text-disabled)] uppercase tracking-widest mb-4">Your Answer</h4>
                            <div className={`text-3xl font-mono font-bold ${status === 'correct' ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                                {userAnswer ?? 'N/A'}
                            </div>
                        </div>
                        <div className="p-6 bg-[var(--color-success-subtle)] border border-[var(--color-success)]/10 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <CheckCircle size={48} weight="fill" className="text-[var(--color-success)]" />
                            </div>
                            <h4 className="text-[9px] font-black text-[var(--color-on-success)] uppercase tracking-widest mb-4">Correct Answer</h4>
                            <div className="text-3xl font-mono font-bold text-[var(--color-success)]">
                                {correctAnswer ?? 'N/A'}
                            </div>
                        </div>
                    </div>
                )}

                {/* Performance Context */}
                {status === 'incorrect' && (
                    <div className="p-4 rounded-xl bg-[var(--color-error-subtle)] border border-[var(--color-error)]/10 text-xs font-medium text-[var(--color-on-error)] opacity-80 leading-relaxed flex gap-3 shadow-[var(--shadow-sm)]">
                        <WarningCircle size={16} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-[var(--color-on-error)] uppercase tracking-widest text-[10px] mb-1">Learning Insight</p>
                            This was a {difficulty} question in {topic}. You spent {time}s.
                            Review the {topic} foundations before your next attempt.
                        </div>
                    </div>
                )}

                {/* Explanation */}
                {explanation && (
                    <div className="space-y-3 pt-4 border-t border-[var(--color-border-default)]">
                        <h4 className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">Step-by-Step Solution</h4>
                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-bg-subtle)] p-6 rounded-2xl">
                            {explanation}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { text: string, bg: string, textCol: string, icon: React.ReactNode }> = {
        correct: { text: 'Correct', bg: 'bg-[var(--color-success-subtle)]', textCol: 'text-[var(--color-on-success)]', icon: <CheckCircle weight="bold" /> },
        incorrect: { text: 'Incorrect', bg: 'bg-[var(--color-error-subtle)]', textCol: 'text-[var(--color-on-error)]', icon: <WarningCircle weight="bold" /> },
        unattempted: { text: 'Unattempted', bg: 'bg-[var(--color-bg-muted)]', textCol: 'text-[var(--color-text-disabled)]', icon: <Clock weight="bold" /> }
    }
    const statusConfig = config[status] || config.unattempted

    return (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.textCol} text-[10px] font-black uppercase tracking-widest`}>
            {statusConfig.icon}
            {statusConfig.text}
        </div>
    )
}

const MetaItem = ({ icon, label, value, color = 'text-white' }: { icon: React.ReactNode, label: string, value: string, color?: string }) => (
    <div className="flex flex-col">
        <span className="text-[8px] font-bold text-[var(--color-text-disabled)] uppercase tracking-widest flex items-center gap-1">
            {icon}{label}
        </span>
        <span className={`text-[11px] font-bold uppercase tracking-tight ${color}`}>{value}</span>
    </div>
)

export default QuestionDetailView
