import React from 'react'
import { TrendUp, TrendDown, Minus } from '@phosphor-icons/react'
import type { MetricCardData } from './types'

interface Props {
    metrics: MetricCardData[]
}

const MetricsRow: React.FC<Props> = ({ metrics }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {metrics.map((metric) => (
                <MetricCard key={metric.id} data={metric} />
            ))}
        </div>
    )
}

/**
 * Determines whether a trend is "positive" (green) or "negative" (red)
 * based on the metric's direction philosophy, not just the arrow.
 *
 *   increase_is_good  →  up = positive,  down = negative
 *   decrease_is_good  →  down = positive, up = negative
 */
function getTrendSentiment(
    arrowDirection: 'up' | 'down' | 'neutral',
    metricDirection: 'increase_is_good' | 'decrease_is_good' = 'increase_is_good'
): 'positive' | 'negative' | 'neutral' {
    if (arrowDirection === 'neutral') return 'neutral'
    if (metricDirection === 'increase_is_good') {
        return arrowDirection === 'up' ? 'positive' : 'negative'
    }
    // decrease_is_good
    return arrowDirection === 'down' ? 'positive' : 'negative'
}

const sentimentStyles = {
    positive: { text: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    negative: { text: 'text-rose-400', bg: 'bg-rose-400/10' },
    neutral: { text: 'text-neutral-400', bg: 'bg-neutral-400/10' },
}

const MetricCard: React.FC<{ data: MetricCardData }> = ({ data }) => {
    const { label, value, trend, icon, color, metricDirection } = data

    const sentiment = trend
        ? getTrendSentiment(trend.direction, metricDirection)
        : 'neutral'
    const styles = sentimentStyles[sentiment]

    return (
        <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-4 hover:bg-[var(--color-bg-muted)] transition-all group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                {icon && <div style={{ color: color?.replace('[', '').replace(']', '') || 'var(--color-text-primary)' }}>{icon}</div>}
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">{label}</p>
                    <div className="flex items-baseline gap-1">
                        <h3 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">{value}</h3>
                    </div>
                </div>

                {trend && (
                    <div className={`flex items-center gap-1.5 mt-3 text-xs font-medium ${styles.text}`}>
                        <div className={`flex items-center justify-center w-4 h-4 rounded-full ${styles.bg}`}>
                            {trend.direction === 'up' ? <TrendUp size={10} weight="bold" /> :
                                trend.direction === 'down' ? <TrendDown size={10} weight="bold" /> : <Minus size={10} weight="bold" />}
                        </div>
                        <span>{trend.label}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MetricsRow
