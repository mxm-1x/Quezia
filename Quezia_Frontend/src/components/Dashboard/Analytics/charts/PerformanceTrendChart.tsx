import React, { useState } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { ChartLineUp } from '@phosphor-icons/react'
import Placeholder from '../../../common/Placeholder'
import type { PerformanceTrendPoint } from '../types'

interface Props {
    data: PerformanceTrendPoint[]
}

const PerformanceTrendChart: React.FC<Props> = ({ data }) => {
    const [activeMetric, setActiveMetric] = useState<'score' | 'accuracy' | 'percentile'>('score')

    return (
        <div className="rounded-3xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-6 backdrop-blur-xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Performance Trend</h3>
                    <p className="text-sm text-[var(--color-text-tertiary)]">Track your improvement over time</p>
                </div>

                <div className="flex bg-[var(--color-bg-subtle)] rounded-lg p-1 border border-[var(--color-border-default)]">
                    {(['score', 'accuracy', 'percentile'] as const).map((metric) => (
                        <button
                            key={metric}
                            onClick={() => setActiveMetric(metric)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${activeMetric === metric
                                ? 'bg-[var(--color-bg-muted)] text-[var(--color-text-primary)] shadow-sm'
                                : 'text-[var(--color-text-disabled)] hover:text-[var(--color-text-secondary)]'
                                }`}
                        >
                            {metric}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-[300px] w-full relative">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-bg-muted)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="var(--color-chart-axis)"
                                tick={{ fill: 'var(--color-chart-tick)', fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="var(--color-chart-axis)"
                                tick={{ fill: 'var(--color-chart-tick)', fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                dx={-10}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--color-chart-tooltip-bg)',
                                    border: '1px solid var(--color-border-default)',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                    color: 'var(--color-chart-tooltip-text)'
                                }}
                                itemStyle={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}
                                labelStyle={{ color: 'var(--color-text-tertiary)', marginBottom: '8px', fontSize: '11px' }}
                                cursor={{ stroke: 'var(--color-border-default)', strokeWidth: 1 }}
                            />
                            <Line
                                type="monotone"
                                dataKey={activeMetric}
                                stroke={
                                    activeMetric === 'score' ? 'var(--color-chart-primary)' :
                                        activeMetric === 'accuracy' ? 'var(--color-chart-secondary)' : 'var(--color-chart-tertiary)'
                                }
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2, fill: 'var(--color-chart-dot-fill)' }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: activeMetric === 'score' ? 'var(--color-chart-primary)' : activeMetric === 'accuracy' ? 'var(--color-chart-secondary)' : 'var(--color-chart-tertiary)' }}
                                animationDuration={1500}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <Placeholder
                        icon={ChartLineUp}
                        title="No Performance Data"
                        description="Complete more tests to see your performance trends and improvement over time."
                        className="border-none bg-transparent p-0"
                    />
                )}
            </div>
        </div>
    )
}

export default PerformanceTrendChart
