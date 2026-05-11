import React from 'react'
import { Trophy, Target, Clock, ChartLineUp, Gauge } from '@phosphor-icons/react'

interface Props {
    title: string
    date: string
    score: number
    totalMarks: number
    accuracy: number
    attemptRate: number
    timeTakenMinutes: number
    riskRatio: number
}

const CompactHeaderSummary: React.FC<Props> = ({
    title,
    date,
    score,
    totalMarks,
    accuracy,
    attemptRate,
    timeTakenMinutes,
    riskRatio
}) => {
    return (
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
                <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">{title}</h1>
                <p className="text-xs text-[var(--color-text-tertiary)] font-medium uppercase tracking-widest">{date}</p>
            </div>

            <div className="flex flex-wrap items-center gap-8 md:gap-12">
                <Metric label="Score" value={`${score}/${totalMarks}`} icon={<Trophy size={16} />} />
                <Metric label="Accuracy" value={`${accuracy}%`} icon={<Target size={16} />} />
                <Metric label="Attempted" value={`${attemptRate}%`} icon={<ChartLineUp size={16} />} />
                <Metric label="Time" value={`${timeTakenMinutes}m`} icon={<Clock size={16} />} />
                <Metric
                    label="Risk Ratio"
                    value={(Number(riskRatio) || 0).toFixed(2)}
                    icon={<Gauge size={16} />}
                    color={(Number(riskRatio) || 0) > 0.4 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]'}
                />
            </div>
        </div>
    )
}

const Metric = ({ label, value, icon, color = 'text-[var(--color-text-primary)]' }: { label: string, value: string | number, icon: React.ReactNode, color?: string }) => (
    <div className="flex items-center gap-3">
        <div className="p-2 bg-[var(--color-bg-subtle)] rounded-lg text-[var(--color-text-tertiary)]">
            {icon}
        </div>
        <div>
            <p className="text-[10px] text-[var(--color-text-tertiary)] font-bold uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className={`text-sm font-bold ${color} leading-none`}>{value}</p>
        </div>
    </div>
)

export default CompactHeaderSummary
