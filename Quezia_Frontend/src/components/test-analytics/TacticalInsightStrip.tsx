import React from 'react'
import { Lightbulb, WarningCircle, Timer } from '@phosphor-icons/react'

export interface TacticalInsight {
    type: 'success' | 'warning' | 'critical'
    text: string
}

interface Props {
    insights: TacticalInsight[]
}

const TacticalInsightStrip: React.FC<Props> = ({ insights }) => {
    if (insights.length === 0) return null

    return (
        <div className="flex flex-wrap gap-4">
            {insights.map((insight, idx) => (
                <div
                    key={idx}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all shadow-[var(--shadow-sm)] ${insight.type === 'critical' ? 'bg-[var(--color-error-subtle)] border-[var(--color-border-default)] text-[var(--color-on-error)]' :
                        insight.type === 'warning' ? 'bg-[var(--color-warning-subtle)] border-[var(--color-border-default)] text-[var(--color-on-warning)]' :
                            'bg-[var(--color-success-subtle)] border-[var(--color-border-default)] text-[var(--color-on-success)]'
                        }`}
                >
                    <div className="shrink-0">
                        {insight.type === 'critical' ? <WarningCircle size={18} weight="fill" /> :
                            insight.type === 'warning' ? <Lightbulb size={18} weight="fill" /> :
                                <Timer size={18} weight="fill" />}
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest leading-none text-[var(--color-text-primary)]">
                        {insight.text}
                    </p>
                </div>
            ))}
        </div>
    )
}

export default TacticalInsightStrip
