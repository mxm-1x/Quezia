import React from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ChartBar, TrendUp, TrendDown, Minus } from '@phosphor-icons/react'
import EmptyAttemptState from './EmptyAttemptState'

export interface Attempt {
    id: string
    score: number
    totalMarks: number
    accuracy: number
    timeTakenMinutes: number
    createdAt: string
}

interface Props {
    testId: string
    attempts: Attempt[]
    onStartTest: () => void
    onClose: () => void
}

const AttemptsAnalyticsPopup: React.FC<Props> = ({
    testId,
    attempts,
    onStartTest,
    onClose,
}) => {
    const navigate = useNavigate()
    if (!attempts || attempts.length === 0) {
        return (
            <div className="absolute top-full right-0 mt-2 w-80 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-base)] backdrop-blur-xl p-6 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <ChartBar className="h-4 w-4 text-[var(--color-accent)]" />
                        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">Analytics</h3>
                    </div>
                    <button onClick={onClose} className="text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)] transition">
                        <X size={16} />
                    </button>
                </div>
                <EmptyAttemptState onStart={onStartTest} />
            </div>
        )
    }

    const sorted = [...attempts].sort(
        (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
    )

    const latest = sorted[sorted.length - 1]
    const previous =
        sorted.length > 1 ? sorted[sorted.length - 2] : undefined

    const best = sorted.reduce((prev, curr) =>
        curr.score > prev.score ? curr : prev
    )


    return (
        <div className="absolute top-full right-0 mt-2 w-[400px] rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-base)] backdrop-blur-xl p-5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)]">
                        <ChartBar className="h-4 w-4 text-[var(--color-accent)]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">Performance Analytics</h3>
                        <p className="text-[10px] text-[var(--color-text-disabled)] uppercase tracking-wider">
                            {attempts.length} Attempt{attempts.length !== 1 ? 's' : ''} recorded
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-neutral-500 hover:text-white transition"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-3 flex flex-col justify-between">
                    <p className="text-[11px] text-[var(--color-text-tertiary)]">Best Score</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
                        {best.score}<span className="text-sm text-[var(--color-text-disabled)] font-normal ml-1">/ {best.totalMarks}</span>
                    </p>
                </div>

                <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-3 flex flex-col justify-between">
                    <p className="text-[11px] text-[var(--color-text-tertiary)]">Latest Score</p>
                    <div className="mt-1 flex items-baseline justify-between">
                        <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                            {latest.score}<span className="text-sm text-[var(--color-text-disabled)] font-normal ml-1">/ {latest.totalMarks}</span>
                        </p>
                        {previous && (
                            <div className={`flex items-center gap-0.5 text-[10px] font-medium ${latest.score > previous.score ? 'text-[var(--color-success)]' : latest.score < previous.score ? 'text-[var(--color-error)]' : 'text-[var(--color-text-disabled)]'
                                }`}>
                                {latest.score > previous.score ? <TrendUp size={10} /> : latest.score < previous.score ? <TrendDown size={10} /> : <Minus size={10} />}
                                {Math.abs(latest.score - previous.score)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-3 flex flex-col justify-between">
                    <p className="text-[11px] text-[var(--color-text-tertiary)]">Accuracy</p>
                    <div className="mt-1 flex items-baseline justify-between">
                        <p className="text-lg font-semibold text-[var(--color-text-primary)]">{latest.accuracy}%</p>
                        {previous && (
                            <div className={`flex items-center gap-0.5 text-[10px] font-medium ${latest.accuracy > previous.accuracy ? 'text-[var(--color-success)]' : latest.accuracy < previous.accuracy ? 'text-[var(--color-error)]' : 'text-[var(--color-text-disabled)]'
                                }`}>
                                {latest.accuracy > previous.accuracy ? <TrendUp size={10} /> : latest.accuracy < previous.accuracy ? <TrendDown size={10} /> : <Minus size={10} />}
                                {Math.abs(latest.accuracy - previous.accuracy)}%
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex flex-col justify-between">
                    <p className="text-[11px] text-neutral-400">Time Taken</p>
                    <div className="mt-1 flex items-baseline justify-between">
                        <p className="text-lg font-semibold text-white">
                            {Math.floor(latest.timeTakenMinutes / 60)}h {latest.timeTakenMinutes % 60}m
                        </p>
                        {previous && (
                            <div className={`flex items-center gap-0.5 text-[10px] font-medium ${latest.timeTakenMinutes < previous.timeTakenMinutes ? 'text-emerald-400' : latest.timeTakenMinutes > previous.timeTakenMinutes ? 'text-rose-400' : 'text-neutral-500'
                                }`}>
                                {latest.timeTakenMinutes < previous.timeTakenMinutes ? <TrendUp size={10} /> : latest.timeTakenMinutes > previous.timeTakenMinutes ? <TrendDown size={10} /> : <Minus size={10} />}
                                {Math.abs(latest.timeTakenMinutes - previous.timeTakenMinutes)}m
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer / Action */}
            <div className="mt-5 pt-4 border-t border-[var(--color-border-default)] flex justify-center">
                <button
                    onClick={() => {
                        onClose()
                        navigate(`/dashboard/analytics/${testId}`)
                    }}
                    className="text-xs font-medium text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)] transition flex items-center gap-1 group"
                >
                    View detailed history
                    <ChartBar size={14} className="group-hover:text-[var(--color-accent)] transition-colors" />
                </button>
            </div>
        </div>
    )
}

export default AttemptsAnalyticsPopup
