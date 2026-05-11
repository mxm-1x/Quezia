import React from 'react'
import { Sparkle, Lightbulb, MagicWand } from '@phosphor-icons/react'
import Placeholder from '../../../common/Placeholder'

interface Props {
    insights: string[]
}

const AIInsightCard: React.FC<Props> = ({ insights }) => {
    const hasValidInsights = insights.length > 0 && !insights[0].toLowerCase().includes('coming soon');

    return (
        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border-default)] bg-[var(--color-bg-base)] p-6 backdrop-blur-xl h-full flex flex-col group">

            {/* Primary soft gradient */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--color-accent-subtle)] via-transparent" />


            <div className="relative z-10 flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-[var(--color-accent-subtle)] border border-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                    <Sparkle weight="fill" className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    AI Insights
                </h3>
            </div>

            <div className="relative z-10 flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                {hasValidInsights ? (
                    insights.map((insight, idx) => (
                        <div
                            key={idx}
                            className="flex gap-3 items-start p-3 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] hover:bg-[var(--color-bg-muted)] transition-colors"
                        >
                            <Lightbulb
                                className="h-4 w-4 text-[var(--color-accent)] opacity-80 shrink-0 mt-0.5"
                                weight="duotone"
                            />
                            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed font-medium">
                                {insight}
                            </p>
                        </div>
                    ))
                ) : (
                    <Placeholder
                        icon={MagicWand}
                        title="AI Insights"
                        description="Deep tactical analysis and personalized recommendations will be generated here."
                        className="border-none bg-transparent p-0"
                        variant="coming-soon"
                    />
                )}
            </div>

            <div className="relative z-10 mt-4 pt-3 border-t border-[var(--color-border-default)]">
                <button className="text-xs font-semibold text-[var(--color-accent)] hover:opacity-80 transition-opacity flex items-center gap-1">
                    Generate new analysis →
                </button>
            </div>
        </div>
    )
}

export default AIInsightCard
