import React from 'react'

interface SubjectData {
    subject: string
    score: number
    maxScore: number
    accuracy: number
    attemptRate: number
    avgTimePerQ: number
    status: 'strong' | 'average' | 'weak'
}

interface Props {
    subjects: SubjectData[]
}

const SubjectPerformanceCard: React.FC<Props> = ({ subjects }) => {
    return (
        <div className="bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-3xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">Subject Analysis</h3>
                <div className="flex gap-4">
                    {['Strong', 'Average', 'Weak'].map(s => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${s === 'Strong' ? 'bg-[var(--color-success)]' :
                                s === 'Average' ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-error)]'
                                }`} />
                            <span className="text-[10px] text-[var(--color-text-disabled)] font-bold uppercase tracking-tight">{s}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[9px] text-[var(--color-text-disabled)] uppercase tracking-[0.2em] font-black border-b border-[var(--color-border-default)]">
                            <th className="pb-4">Subject</th>
                            <th className="pb-4">Accuracy</th>
                            <th className="pb-4 text-right">Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-default)]">
                        {subjects.map((s, i) => (
                            <tr key={i} className="group">
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1 h-3 rounded-full ${s.status === 'strong' ? 'bg-[var(--color-success)]' :
                                            s.status === 'average' ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-error)]'
                                            }`} />
                                        <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-tight">{s.subject}</span>
                                    </div>
                                </td>
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-mono font-bold text-[var(--color-text-primary)]">{s.accuracy}%</span>
                                        <div className="w-20 h-1 bg-[var(--color-bg-subtle)] rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${s.accuracy > 75 ? 'bg-[var(--color-success)]' :
                                                    s.accuracy > 50 ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-error)]'
                                                    }`}
                                                style={{ width: `${s.accuracy}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 text-right">
                                    <span className="text-sm font-mono font-bold text-[var(--color-text-secondary)]">{s.score}</span>
                                    <span className="text-[10px] text-[var(--color-text-disabled)] font-bold ml-1">/ {s.maxScore}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default SubjectPerformanceCard
