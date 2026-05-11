import React from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import GlassCard from '../../../components/Dashboard/GlassCard'
import { CheckCircle, Timer, Target, Trophy } from '@phosphor-icons/react'

import { type Attempt, type Test } from '../../../services/test-engine/test-engine.service'

const TestResultPage: React.FC = () => {
    const { threadId } = useParams<{ threadId: string }>()
    const location = useLocation()
    const navigate = useNavigate()
    const { result, test } = (location.state as { result: Attempt; test: Test }) || {}

    if (!result) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] text-white">
                <p>No results found. <button onClick={() => navigate('/dashboard/tests')} className="text-[var(--color-accent)] underline">Go back</button></p>
            </div>
        )
    }

    const formatTime = (seconds: number): string => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}m ${s}s`
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-base)] px-6 pt-24 pb-12">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Test Results</h1>
                        <p className="text-[var(--color-text-tertiary)]">
                            {test?.threadId ? test.threadId : 'Test Attempt'} Completed
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(`/dashboard/tests/thread/${threadId}`)}
                        className="bg-[var(--color-bg-subtle)] text-white px-6 py-2 rounded-xl border border-[var(--color-border-default)] hover:bg-[var(--color-bg-muted)] transition"
                    >
                        Back to Thread
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard
                        icon={<Trophy className="text-yellow-400" size={24} />}
                        label="Total Score"
                        value={`${result.totalScore}`}
                        subValue="points"
                    />
                    <StatCard
                        icon={<Target className="text-blue-400" size={24} />}
                        label="Accuracy"
                        value={`${Math.round(result.accuracy || 0)}%`}
                        subValue="correct"
                    />
                    <StatCard
                        icon={<Timer className="text-emerald-400" size={24} />}
                        label="Time Spent"
                        value={formatTime(result.timeSpentSeconds || 0)}
                        subValue="total"
                    />
                    <StatCard
                        icon={<CheckCircle className="text-purple-400" size={24} />}
                        label="Rank"
                        value={`#${result.userRank}`}
                        subValue={`out of ${result.percentile}%`}
                    />
                </div>

                <GlassCard title="Performance Summary" subtitle="Your overall test metrics and insights">
                    <div className="space-y-6">
                        <p className="text-[var(--color-text-secondary)]">
                            Great job! You've completed the test. Your performance shows a solid understanding of the concepts. Use the analytics section to dive deeper into subject-wise performance.
                        </p>

                        <div className="pt-4 border-t border-[var(--color-border-default)] flex gap-4">
                            <button
                                onClick={() => navigate(`/dashboard/analytics/${test?.id}`)}
                                className="bg-[var(--color-accent)] text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition"
                            >
                                View Detailed Analytics
                            </button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    )
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; subValue?: string }> = ({ icon, label, value, subValue }) => (
    <div className="bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[var(--color-bg-muted)] rounded-lg">
                {icon}
            </div>
            <span className="text-sm text-[var(--color-text-tertiary)] font-medium">{label}</span>
        </div>
        <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{value}</span>
            {subValue && <span className="text-xs text-[var(--color-text-tertiary)]">{subValue}</span>}
        </div>
    </div>
)

export default TestResultPage
