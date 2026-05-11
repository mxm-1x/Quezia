import React from 'react'

interface Insight {
    type: 'success' | 'warning' | 'info' | 'critical'
    text: string
    icon: React.ReactNode
}

interface Props {
    insights: Insight[]
}

const InsightBar: React.FC<Props> = ({ insights }) => {
    if (insights.length === 0) return null

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
                <div
                    key={index}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all shadow-[var(--shadow-sm)] ${insight.type === 'critical' ? 'bg-[var(--color-error-subtle)] border-[var(--color-border-default)] text-[var(--color-on-error)]' :
                        insight.type === 'warning' ? 'bg-[var(--color-warning-subtle)] border-[var(--color-border-default)] text-[var(--color-on-warning)]' :
                            'bg-[var(--color-success-subtle)] border-[var(--color-border-default)] text-[var(--color-on-success)]'
                        }`}
                >
                    <div className={`p-2 rounded-xl ${insight.type === 'success' ? 'bg-[var(--color-success-subtle)]' :
                        insight.type === 'warning' ? 'bg-[var(--color-warning-subtle)]' :
                            insight.type === 'critical' ? 'bg-[var(--color-error-subtle)]' :
                                'bg-[var(--color-info-subtle)]'
                        }`}>
                        {insight.icon}
                    </div>
                    <p className="text-sm font-medium leading-relaxed mt-1 text-[var(--color-text-secondary)]">
                        {insight.text}
                    </p>
                </div>
            ))}
        </div>
    )
}

export default InsightBar
