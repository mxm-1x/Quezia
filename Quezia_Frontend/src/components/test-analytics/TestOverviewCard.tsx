import React from 'react'
import { Trophy, Target, Clock, ChartLineUp, Gauge, ShieldCheck, ChartBar } from '@phosphor-icons/react'

interface Props {
    title: string
    date: string
    score: number
    totalMarks: number
    accuracy: number
    attemptRate: number
    timeTakenMinutes: number
    totalTimeMinutes: number
    riskRatio: number // Incorrect / Attempted
    efficiency: number // Score / Time
    correct: number
    incorrect: number
    unattempted: number
}

const TestOverviewCard: React.FC<Props> = ({
    title,
    date,
    score,
    totalMarks,
    accuracy,
    attemptRate,
    timeTakenMinutes,
    totalTimeMinutes,
    riskRatio,
    efficiency,
    correct,
    incorrect,
    unattempted
}) => {
    return (
        <div className="bg-[var(--color-bg-base)] backdrop-blur-md border border-[var(--color-border-default)] rounded-3xl p-8 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-[var(--color-info)] opacity-5 rounded-full blur-[100px]" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[var(--color-accent)] opacity-5 rounded-full blur-[100px]" />

            <div className="relative space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">{title}</h1>
                        <p className="text-[var(--color-text-tertiary)] text-sm mt-1 uppercase tracking-widest font-semibold">{date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-6 py-3 bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded-2xl text-center">
                            <div className="text-xs text-[var(--color-text-tertiary)] uppercase font-bold tracking-tighter mb-1">Final Score</div>
                            <div className="text-4xl font-bold text-[var(--color-text-primary)] tracking-tighter">
                                {score}<span className="text-lg text-[var(--color-text-disabled)] font-medium"> / {totalMarks}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Primary Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricBlock
                        label="Accuracy"
                        value={`${accuracy}%`}
                        icon={<Target size={20} className="text-[var(--color-info)]" />}
                        subValue={`${correct} Correct / ${incorrect} Incorrect`}
                    />
                    <MetricBlock
                        label="Attempt Rate"
                        value={`${attemptRate}%`}
                        icon={<ChartLineUp size={20} className="text-[var(--color-success)]" />}
                        subValue={`${correct + incorrect} / ${correct + incorrect + unattempted} Qs`}
                    />
                    <MetricBlock
                        label="Time Spent"
                        value={`${timeTakenMinutes}m`}
                        icon={<Clock size={20} className="text-[var(--color-warning)]" />}
                        subValue={`of ${totalTimeMinutes}m limit`}
                    />
                    <MetricBlock
                        label="Efficiency"
                        value={(Number(efficiency) || 0).toFixed(2)}
                        icon={<ChartBar size={20} className="text-[var(--color-accent)]" />}
                        subValue="Marks per minute"
                    />
                </div>

                {/* Behavioral Strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border-default)] shadow-[var(--shadow-sm)]">
                    <BehavioralMetric
                        label="Risk Ratio"
                        value={(Number(riskRatio) || 0).toFixed(2)}
                        icon={<ShieldCheck size={18} />}
                        desc="Incorrect per attempted Q"
                        color={(Number(riskRatio) || 0) > 0.4 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]'}
                    />
                    <div className="w-px h-full bg-[var(--color-border-default)] hidden md:block" />
                    <BehavioralMetric
                        label="Status"
                        value={accuracy > 70 ? 'Optimal' : accuracy > 50 ? 'Developing' : 'Critical'}
                        icon={<Gauge size={18} />}
                        desc="Overall performance health"
                        color={accuracy > 70 ? 'text-[var(--color-success)]' : accuracy > 50 ? 'text-[var(--color-warning)]' : 'text-[var(--color-error)]'}
                    />
                    <div className="w-px h-full bg-[var(--color-border-default)] hidden md:block" />
                    <BehavioralMetric
                        label="Accuracy Goal"
                        value="85%"
                        icon={<Trophy size={18} />}
                        desc="Competitive JEE target"
                    />
                </div>
            </div>
        </div>
    )
}

const MetricBlock = ({ label, value, icon, subValue }: { label: string, value: string, icon: React.ReactNode, subValue: string }) => (
    <div className="space-y-2">
        <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
            {icon}
            <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
        </div>
        <div>
            <div className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">{value}</div>
            <div className="text-[10px] text-[var(--color-text-disabled)] font-medium uppercase mt-0.5">{subValue}</div>
        </div>
    </div>
)

const BehavioralMetric = ({ label, value, icon, desc, color = 'text-[var(--color-text-primary)]' }: { label: string, value: string, icon: React.ReactNode, desc: string, color?: string }) => (
    <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-subtle)] flex items-center justify-center text-[var(--color-text-tertiary)]">
            {icon}
        </div>
        <div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--color-text-tertiary)] font-bold uppercase tracking-wider">{label}</span>
                <span className={`text-sm font-bold tracking-tight ${color}`}>{value}</span>
            </div>
            <div className="text-[10px] text-[var(--color-text-disabled)] font-medium leading-tight mt-0.5">{desc}</div>
        </div>
    </div>
)

export default TestOverviewCard
