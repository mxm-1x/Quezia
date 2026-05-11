import React from 'react'
import { GraduationCap, CalendarBlank, TrendUp, Target, BookOpen } from '@phosphor-icons/react'

interface AcademicContextProps {
    targetExam: string
    targetExamYear: number
    preparationStage: string
    studyGoal: string
    onUpdate: (fields: Partial<AcademicContextProps>) => void
}

const stageOptions = ['Beginner', 'Intermediate', 'Advanced']
const yearOptions = [2025, 2026, 2027, 2028]

const AcademicContext: React.FC<AcademicContextProps> = ({
    targetExam,
    targetExamYear,
    preparationStage,
    studyGoal,
    onUpdate,
}) => {

    return (
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <GraduationCap size={18} className="text-[var(--color-accent)]" />
                Academic Context
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Exam (set during onboarding) */}
                <div>
                    <label className="text-xs font-medium text-[var(--color-text-disabled)] mb-1.5 flex items-center gap-1.5">
                        <Target size={12} /> Target Exam
                    </label>
                    <div className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-sm text-[var(--color-text-primary)] px-3 py-2.5 flex items-center justify-between">
                        <span className="font-medium">{targetExam}</span>
                        <span className="text-[10px] text-[var(--color-text-disabled)] uppercase tracking-wider">Set in onboarding</span>
                    </div>
                </div>

                {/* Target Year */}
                <div>
                    <label className="text-xs font-medium text-[var(--color-text-disabled)] mb-1.5 flex items-center gap-1.5">
                        <CalendarBlank size={12} /> Target Year
                    </label>
                    <select
                        value={targetExamYear}
                        onChange={(e) => onUpdate({ targetExamYear: Number(e.target.value) })}
                        className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] text-sm text-[var(--color-text-primary)] px-3 py-2.5 outline-none focus:border-[var(--color-accent)] transition-colors"
                    >
                        {yearOptions.map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                {/* Preparation Stage */}
                <div>
                    <label className="text-xs font-medium text-[var(--color-text-disabled)] mb-1.5 flex items-center gap-1.5">
                        <TrendUp size={12} /> Preparation Stage
                    </label>
                    <select
                        value={preparationStage}
                        onChange={(e) => onUpdate({ preparationStage: e.target.value })}
                        className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] text-sm text-[var(--color-text-primary)] px-3 py-2.5 outline-none focus:border-[var(--color-accent)] transition-colors"
                    >
                        {stageOptions.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                {/* Study Goal */}
                <div>
                    <label className="text-xs font-medium text-[var(--color-text-disabled)] mb-1.5 flex items-center gap-1.5">
                        <BookOpen size={12} /> Study Goal
                    </label>
                    <input
                        type="text"
                        value={studyGoal}
                        onChange={(e) => onUpdate({ studyGoal: e.target.value })}
                        placeholder="e.g. Rank under 1000"
                        className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] text-sm text-[var(--color-text-primary)] px-3 py-2.5 outline-none focus:border-[var(--color-accent)] transition-colors placeholder:text-[var(--color-text-disabled)]"
                    />
                </div>
            </div>
        </div>
    )
}

export default AcademicContext
