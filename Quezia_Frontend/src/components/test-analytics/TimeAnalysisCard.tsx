import React from 'react'

interface Props {
    avgTimeEasy: number
    avgTimeMedium: number
    avgTimeHard: number
    totalTimeSpent: number
    slowestQuestions: {
        id: number
        time: number
        subject: string
        status: 'correct' | 'incorrect' | 'unattempted'
    }[]
}

const TimeAnalysisCard: React.FC<Props> = ({
    avgTimeEasy,
    avgTimeMedium,
    avgTimeHard,
    totalTimeSpent,
    slowestQuestions
}) => {
    return (
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-3xl p-6 h-full space-y-8">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">Time Budget</h3>
                <div className="text-[10px] font-mono font-bold text-[var(--color-text-disabled)] uppercase tracking-widest bg-[var(--color-bg-subtle)] px-3 py-1 rounded-lg">
                    Total: {Math.floor(totalTimeSpent / 60)}m {totalTimeSpent % 60}s
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <TimeBox label="Easy" value={`${avgTimeEasy}s`} color="text-[var(--color-success)]" />
                <TimeBox label="Medium" value={`${avgTimeMedium}s`} color="text-[var(--color-warning)]" />
                <TimeBox label="Hard" value={`${avgTimeHard}s`} color="text-[var(--color-error)]" />
            </div>

            <div className="space-y-4">
                <div className="text-[10px] text-[var(--color-text-disabled)] font-bold uppercase tracking-[0.2em]">Slowest Debuts</div>
                <div className="space-y-2">
                    {slowestQuestions.map((q, i) => (
                        <div key={i} className="flex items-center justify-between py-3 px-4 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl group transition-all shadow-[var(--shadow-sm)]">
                            <div className="flex items-center gap-4">
                                <div className="text-[10px] font-bold text-[var(--color-text-disabled)] opacity-50">#{q.id}</div>
                                <div>
                                    <div className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-tight">{q.subject}</div>
                                    <div className={`text-[9px] font-black uppercase tracking-widest ${q.status === 'correct' ? 'text-[var(--color-success)] opacity-80' :
                                        q.status === 'incorrect' ? 'text-[var(--color-error)] opacity-80' : 'text-[var(--color-text-disabled)]'
                                        }`}>
                                        {q.status}
                                    </div>
                                </div>
                            </div>
                            <div className="text-sm font-mono font-bold text-[var(--color-text-primary)]">{q.time}s</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

const TimeBox = ({ label, value, color }: { label: string, value: string, color: string }) => (
    <div className="p-4 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-[var(--shadow-sm)]">
        <div className="text-[8px] font-bold text-[var(--color-text-disabled)] uppercase tracking-widest mb-1">{label}</div>
        <div className={`text-lg font-bold font-mono ${color}`}>{value}</div>
    </div>
)

export default TimeAnalysisCard
