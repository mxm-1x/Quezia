import React from 'react'

type TrendType = 'up' | 'down' | 'neutral' | undefined

interface Props {
  label: string
  value: string
  delta?: number
  trend?: TrendType
}

const AnalyticsMetricCard: React.FC<Props> = ({
  label,
  value,
  delta,
  trend,
}) => {
  const getTrendColor = () => {
    if (!trend) return 'text-neutral-500'
    if (trend === 'up') return 'text-emerald-400'
    if (trend === 'down') return 'text-rose-400'
    return 'text-neutral-500'
  }

  const getTrendSymbol = () => {
    if (!trend) return ''
    if (trend === 'up') return '↑'
    if (trend === 'down') return '↓'
    return '→'
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between">
      <p className="text-xs text-neutral-400">{label}</p>

      <div className="mt-2 flex items-end justify-between">
        <p className="text-xl font-semibold text-white">{value}</p>

        {delta !== undefined && (
          <p className={`text-xs font-medium ${getTrendColor()}`}>
            {getTrendSymbol()} {Math.abs(delta)}
          </p>
        )}
      </div>
    </div>
  )
}

export default AnalyticsMetricCard
