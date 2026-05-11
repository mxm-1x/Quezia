import { useState } from 'react'
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts'
import { Target } from '@phosphor-icons/react'
import Placeholder from '../../../common/Placeholder'
import type { SubjectMastery } from '../types'

interface Props {
    data: SubjectMastery[]
}

type Metric = 'accuracy' | 'avgMark'

const SubjectMasteryChart: React.FC<Props> = ({ data }) => {
    const [metric, setMetric] = useState<Metric>('accuracy')

    const label = metric === 'accuracy' ? 'Accuracy' : 'Avg Mark'
    const suffix = metric === 'accuracy' ? '%' : ''

    return (
        <div className="rounded-3xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-5 pt-4 backdrop-blur-xl h-full flex flex-col overflow-hidden">
            {/* Compact header: title + toggle on one line */}
            <div className="flex items-center justify-between shrink-0">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Subject Mastery</h3>
                <div className="flex rounded-lg bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] p-0.5">
                    <button
                        onClick={() => setMetric('accuracy')}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-200 ${metric === 'accuracy'
                            ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] shadow-sm'
                            : 'text-[var(--color-text-disabled)] hover:text-[var(--color-text-secondary)]'
                            }`}
                    >
                        Accuracy
                    </button>
                    <button
                        onClick={() => setMetric('avgMark')}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-200 ${metric === 'avgMark'
                            ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] shadow-sm'
                            : 'text-[var(--color-text-disabled)] hover:text-[var(--color-text-secondary)]'
                            }`}
                    >
                        Avg Mark
                    </button>
                </div>
            </div>

            {/* Radar chart — takes all remaining space */}
            <div className="flex-1 min-h-0 relative">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="55%" outerRadius="78%" data={data}>
                            <PolarGrid stroke="var(--color-bg-muted)" opacity={0.5} />
                            <PolarAngleAxis
                                dataKey="subject"
                                tick={{ fill: 'var(--color-chart-tick)', fontSize: 11, fontWeight: 500 }}
                            />
                            <Radar
                                name={label}
                                dataKey={metric}
                                stroke="var(--color-accent)"
                                fill="var(--color-accent)"
                                fillOpacity={0.5}
                                animationDuration={800}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--color-chart-tooltip-bg)',
                                    border: '1px solid var(--color-border-default)',
                                    borderRadius: '12px',
                                    color: 'var(--color-chart-tooltip-text)',
                                    fontSize: '12px'
                                }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                ) : (
                    <Placeholder
                        icon={Target}
                        title="No Mastery Data"
                        description="Complete tests to see your subject-wise proficiency breakdown."
                        className="border-none bg-transparent p-0"
                    />
                )}
            </div>

            {/* Footer stats */}
            <div className="shrink-0 px-4 pb-1 flex justify-around">
                {data.map((item) => (
                    <div key={item.subject} className="flex flex-col items-center">
                        <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">{item.subject}</span>
                        <span className="text-sm font-bold text-[var(--color-text-primary)]">
                            {metric === 'accuracy' ? item.accuracy : item.avgMark}{suffix}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default SubjectMasteryChart
