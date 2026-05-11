import React from 'react'
import { TrendUp, TrendDown, Equals } from '@phosphor-icons/react'

interface Delta {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
    isGood: boolean
}

interface Props {
    deltas: Delta[]
}

const ImprovementComparisonCard: React.FC<Props> = ({ deltas }) => {
    return (
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-3xl p-6 h-full flex flex-col justify-center">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">Growth Vector</h3>
                    <p className="text-[10px] text-[var(--color-text-disabled)] mt-1 uppercase tracking-widest font-black">Performance Delta</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {deltas.map((d, i) => (
                    <div key={i} className="text-center">
                        <div className="text-[9px] text-[var(--color-text-disabled)] font-black uppercase tracking-[0.2em] mb-3">{d.label}</div>
                        <div className={`flex items-center justify-center gap-2 text-xl font-bold font-mono tracking-tighter ${d.direction === 'neutral' ? 'text-[var(--color-text-tertiary)]' :
                            d.isGood ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
                            }`}>
                            {d.direction === 'up' ? <TrendUp weight="bold" /> :
                                d.direction === 'down' ? <TrendDown weight="bold" /> :
                                    <Equals weight="bold" />}
                            {d.value > 0 ? `+${d.value}` : d.value}{d.label.includes('%') ? '%' : ''}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ImprovementComparisonCard
