import React from 'react'
import { Timer } from '@phosphor-icons/react'
import Placeholder from '../../../common/Placeholder'
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ZAxis,
    Cell
} from 'recharts'

interface Props {
    // Mock data structure for scatter plot points
    data: {
        timeSpent: number; // minutes
        accuracy: number; // percentage
        testId: string;
        difficulty: 'easy' | 'medium' | 'hard';
    }[]
}

const TimeEfficiencyChart: React.FC<Props> = ({ data }) => {
    return (
        <div className="rounded-3xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-6 backdrop-blur-xl h-full">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Time vs. Efficiency</h3>
                <p className="text-sm text-[var(--color-text-tertiary)]">Speed and accuracy correlation</p>
            </div>

            <div className="h-[250px] w-full relative">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-bg-muted)" opacity={0.5} />
                            <XAxis
                                type="number"
                                dataKey="timeSpent"
                                name="Time"
                                unit="m"
                                stroke="var(--color-chart-axis)"
                                tick={{ fill: 'var(--color-chart-tick)', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis
                                type="number"
                                dataKey="accuracy"
                                name="Accuracy"
                                unit="%"
                                stroke="var(--color-chart-axis)"
                                tick={{ fill: 'var(--color-chart-tick)', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                dx={-10}
                            />
                            <ZAxis type="category" dataKey="difficulty" name="Difficulty" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--color-chart-tooltip-bg)',
                                    border: '1px solid var(--color-accent-subtle)',
                                    borderRadius: '16px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                    padding: '12px',
                                    color: 'var(--color-chart-tooltip-text)'
                                }}
                                itemStyle={{ color: 'var(--color-chart-tooltip-text)', fontSize: '13px' }}
                                labelStyle={{ color: 'var(--color-text-tertiary)', fontSize: '11px', marginBottom: '4px' }}
                            />
                            <Scatter
                                name="Attempts"
                                data={data}
                                fill="var(--color-chart-secondary)"
                                animationDuration={1500}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.difficulty === 'hard' ? 'var(--color-error)' : entry.difficulty === 'medium' ? 'var(--color-warning)' : 'var(--color-info)'} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                ) : (
                    <Placeholder
                        icon={Timer}
                        title="Efficiency Tracking"
                        description="Data on your speed vs. accuracy will appear here as you take more tests."
                        className="border-none bg-transparent p-0"
                    />
                )}
            </div>
        </div>
    )
}

export default TimeEfficiencyChart
