import React from 'react'
import { Timer, WarningCircle, Target } from '@phosphor-icons/react'

interface WeakTopic {
    name: string
    subject: string
    accuracy: number
    negatives: number
    avgTime: number
    reason: 'accuracy' | 'time' | 'negatives'
}

interface Props {
    topics: WeakTopic[]
}

const TopicWeaknessCard: React.FC<Props> = ({ topics }) => {
    return (
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-3xl p-6 h-full space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">Growth Targets</h3>
                <span className="text-[10px] text-[var(--color-text-disabled)] font-bold uppercase tracking-widest">Focus Areas</span>
            </div>

            <div className="space-y-3">
                {topics.map((t, i) => (
                    <div key={i} className="group p-4 bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border-default)] hover:border-[var(--color-border-hover)] transition-all shadow-[var(--shadow-sm)]">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-[9px] font-black text-[var(--color-text-disabled)] uppercase tracking-[0.2em]">{t.subject}</span>
                                <h4 className="text-xs font-bold text-[var(--color-text-secondary)] mt-1 uppercase tracking-tight">{t.name}</h4>
                            </div>
                            <div className={`p-1.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] ${t.reason === 'negatives' ? 'text-[var(--color-error)]' :
                                t.reason === 'time' ? 'text-[var(--color-warning)]' : 'text-[var(--color-accent)]'
                                }`}>
                                {t.reason === 'negatives' && <WarningCircle size={14} weight="fill" />}
                                {t.reason === 'time' && <Timer size={14} weight="fill" />}
                                {t.reason === 'accuracy' && <Target size={14} weight="fill" />}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <TopicStat label="Accuracy" value={`${t.accuracy}%`} />
                            <TopicStat label="Score Leak" value={`-${t.negatives}`} color="text-[var(--color-error)]" />
                            <TopicStat label="Pace" value={`${t.avgTime}s`} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

const TopicStat = ({ label, value, color }: { label: string, value: string, color?: string }) => (
    <div>
        <div className="text-[8px] text-[var(--color-text-disabled)] font-black uppercase tracking-widest mb-1">{label}</div>
        <div className={`text-sm font-mono font-bold ${color || 'text-[var(--color-text-secondary)]'}`}>{value}</div>
    </div>
)

export default TopicWeaknessCard
