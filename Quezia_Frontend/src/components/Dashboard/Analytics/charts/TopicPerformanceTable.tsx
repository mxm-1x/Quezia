import React, { useState, useMemo } from 'react'
import {
    MagnifyingGlass,
    CaretDown,
    CaretUp,
    Clock,
    WarningOctagon,
    TrendUp,
    TrendDown,
    Minus,
    Funnel,
    SortAscending,
    Target,
    ListChecks
} from '@phosphor-icons/react'
import type { TopicHealth } from '../types'
import { BlockDropdown } from '../../../common/Dropdown'
import Placeholder from '../../../common/Placeholder'

interface Props {
    data: TopicHealth[]
}

type SortOption = 'accuracy_asc' | 'accuracy_desc' | 'most_attempted' | 'largest_drop' | 'largest_improvement'
type FilterSubject = 'All' | 'Physics' | 'Chemistry' | 'Maths'
type FilterAccuracy = 'All' | 'Below 50%' | '50-70%' | 'Above 70%'

const TopicPerformanceTable: React.FC<Props> = ({ data }) => {
    const [searchQuery, setSearchQuery] = useState('')
    const [subjectFilter, setSubjectFilter] = useState<FilterSubject>('All')
    const [accuracyFilter, setAccuracyFilter] = useState<FilterAccuracy>('All')
    const [sortBy, setSortBy] = useState<SortOption>('accuracy_asc')
    const [expandedTopic, setExpandedTopic] = useState<string | null>(null)

    // Dropdown States
    const [subjectOpen, setSubjectOpen] = useState(false)
    const [accuracyOpen, setAccuracyOpen] = useState(false)
    const [sortOpen, setSortOpen] = useState(false)

    // --- Filter & Sort Logic ---
    const processedData = useMemo(() => {
        let filtered = data.filter(item =>
            item.topic.toLowerCase().includes(searchQuery.toLowerCase())
        )

        if (subjectFilter !== 'All') {
            filtered = filtered.filter(item => item.subject === subjectFilter)
        }

        if (accuracyFilter === 'Below 50%') {
            filtered = filtered.filter(item => item.accuracy < 50)
        } else if (accuracyFilter === '50-70%') {
            filtered = filtered.filter(item => item.accuracy >= 50 && item.accuracy <= 70)
        } else if (accuracyFilter === 'Above 70%') {
            filtered = filtered.filter(item => item.accuracy > 70)
        }

        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'accuracy_asc': return a.accuracy - b.accuracy
                case 'accuracy_desc': return b.accuracy - a.accuracy
                case 'most_attempted': return b.attempted - a.attempted
                case 'largest_drop': return a.trendDelta - b.trendDelta
                case 'largest_improvement': return b.trendDelta - a.trendDelta
                default: return 0
            }
        })
    }, [data, searchQuery, subjectFilter, accuracyFilter, sortBy])

    const toggleExpand = (topic: string) => {
        setExpandedTopic(expandedTopic === topic ? null : topic)
    }

    // Helper for consistency color
    const getConsistencyColor = (consistency: string) => {
        switch (consistency) {
            case 'stable': return 'text-[var(--color-success)]'
            case 'improving': return 'text-[var(--color-info)]'
            case 'volatile': return 'text-[var(--color-warning)]'
            case 'declining': return 'text-[var(--color-error)]'
            default: return 'text-[var(--color-text-tertiary)]'
        }
    }

    return (
        <div className="rounded-3xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] backdrop-blur-xl h-full flex flex-col overflow-hidden">
            {/* Header & Controls */}
            <div className="p-6 border-b border-[var(--color-border-default)] space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Topic Performance</h3>
                        <p className="text-sm text-[var(--color-text-tertiary)]">Detailed topic-wise analysis</p>
                    </div>

                    <div className="flex flex-wrap gap-2 z-20">
                        {/* Search */}
                        <div className="relative grow md:grow-0 w-full md:w-auto">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-disabled)]" size={14} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-72 bg-black/20 border border-[var(--color-border-default)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent-subtle)] transition-all h-9"
                            />
                        </div>

                        {/* Subject Filter */}
                        <div className="w-32">
                            <BlockDropdown
                                options={[
                                    { value: 'All', label: 'All Subjects' },
                                    { value: 'Physics', label: 'Physics' },
                                    { value: 'Chemistry', label: 'Chemistry' },
                                    { value: 'Maths', label: 'Maths' },
                                ]}
                                value={subjectFilter}
                                onChange={setSubjectFilter}
                                isOpen={subjectOpen}
                                setIsOpen={setSubjectOpen}
                                placeholder="Subject"
                            />
                        </div>

                        {/* Accuracy Filter */}
                        <div className="w-36">
                            <BlockDropdown
                                options={[
                                    { value: 'All', label: 'All Accuracy' },
                                    { value: 'Below 50%', label: 'Below 50%' },
                                    { value: '50-70%', label: '50-70%' },
                                    { value: 'Above 70%', label: 'Above 70%' },
                                ]}
                                value={accuracyFilter}
                                onChange={setAccuracyFilter}
                                isOpen={accuracyOpen}
                                setIsOpen={setAccuracyOpen}
                                placeholder="Accuracy"
                                icon={<Target size={14} />}
                            />
                        </div>

                        {/* Sort Control */}
                        <div className="w-48 ml-auto md:ml-0">
                            <BlockDropdown
                                options={[
                                    { value: 'accuracy_asc', label: 'Accuracy (Low to High)' },
                                    { value: 'accuracy_desc', label: 'Accuracy (High to Low)' },
                                    { value: 'most_attempted', label: 'Most Attempted' },
                                    { value: 'largest_drop', label: 'Largest Drop' },
                                    { value: 'largest_improvement', label: 'Largest Improvement' },
                                ]}
                                value={sortBy}
                                onChange={setSortBy}
                                isOpen={sortOpen}
                                setIsOpen={setSortOpen}
                                placeholder="Sort By"
                                icon={<SortAscending size={14} />}
                                alignRight
                                showActiveStyle
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--color-border-default)] bg-[var(--color-bg-base)] opacity-50 text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] font-medium">
                <div className="col-span-4 md:col-span-5">Topic</div>
                <div className="col-span-3 md:col-span-2 text-right">Accuracy</div>
                <div className="col-span-2 md:col-span-2 text-right hidden md:block">Attempts</div>
                <div className="col-span-3 md:col-span-2 text-right">Trend</div>
                <div className="col-span-2 md:col-span-1 text-center">Action</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {processedData.length > 0 ? (
                    processedData.map((item) => {
                        const isExpanded = expandedTopic === item.topic
                        return (
                            <div key={item.topic} className={`border-b border-[var(--color-border-default)] transition-colors ${isExpanded ? 'bg-[var(--color-bg-muted)]' : 'hover:bg-[var(--color-bg-base)]'}`}>
                                {/* Main Row */}
                                <div
                                    className="grid grid-cols-12 gap-4 px-6 py-3.5 cursor-pointer items-center group"
                                    onClick={() => toggleExpand(item.topic)}
                                >
                                    <div className="col-span-4 md:col-span-5 flex items-center gap-3">
                                        <div className={`w-1 h-8 rounded-full shrink-0 ${item.accuracy >= 70 ? 'bg-[var(--color-success)]' :
                                            item.accuracy >= 50 ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-error)]'
                                            }`} />
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent)] transition-colors">{item.topic}</div>
                                            <div className="text-[10px] text-[var(--color-text-tertiary)]">{item.subject}</div>
                                        </div>
                                    </div>

                                    <div className="col-span-3 md:col-span-2 text-right font-mono text-sm text-[var(--color-text-secondary)]">
                                        {item.accuracy}%
                                    </div>

                                    <div className="col-span-2 md:col-span-2 text-right hidden md:block text-xs text-[var(--color-text-tertiary)]">
                                        {item.attempted} <span className="text-[10px] text-[var(--color-text-disabled)]">/ {item.totalAvailable}</span>
                                    </div>

                                    <div className="col-span-3 md:col-span-2 text-right flex justify-end">
                                        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-bg-base)] ${item.trendDelta > 0 ? 'text-[var(--color-success)]' :
                                            item.trendDelta < 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-tertiary)]'
                                            }`}>
                                            {item.trendDelta > 0 ? <TrendUp size={12} weight="bold" /> :
                                                item.trendDelta < 0 ? <TrendDown size={12} weight="bold" /> : <Minus size={12} />}
                                            {Math.abs(item.trendDelta)}%
                                        </div>
                                    </div>

                                    <div className="col-span-2 md:col-span-1 flex justify-center text-[var(--color-text-disabled)] group-hover:text-[var(--color-text-primary)] transition-colors">
                                        {isExpanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-1 duration-200">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border-default)]">

                                            {/* Key Metrics */}
                                            <div className="space-y-3 md:col-span-1 md:border-r border-[var(--color-border-default)] md:pr-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                                                        <Clock size={14} /> Avg Time
                                                    </div>
                                                    <span className="text-xs font-medium text-[var(--color-text-primary)]">{item.avgTimePerQ}s</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                                                        <WarningOctagon size={14} /> Negative Rate
                                                    </div>
                                                    <span className="text-xs font-medium text-[var(--color-text-primary)]">{item.negativeRate}%</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                                                        <Funnel size={14} /> Last Tested
                                                    </div>
                                                    <span className="text-xs font-medium text-[var(--color-text-primary)]">{item.lastTestedDate}</span>
                                                </div>
                                            </div>

                                            {/* Difficulty Breakdown */}
                                            <div className="md:col-span-2 space-y-3 md:border-r border-[var(--color-border-default)] md:px-4">
                                                <div className="text-[10px] uppercase text-[var(--color-text-disabled)] tracking-wider">Difficulty Accuracy</div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {/* Easy */}
                                                    <div>
                                                        <div className="flex justify-between items-end mb-1.5">
                                                            <span className="text-[10px] text-[var(--color-text-tertiary)]">Easy</span>
                                                            <span className="text-xs font-semibold text-[var(--color-success)]">{item.difficultyBreakdown.easy}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-[var(--color-bg-muted)] rounded-full overflow-hidden">
                                                            <div className="h-full bg-[var(--color-success)] rounded-full" style={{ width: `${item.difficultyBreakdown.easy}%` }} />
                                                        </div>
                                                    </div>
                                                    {/* Medium */}
                                                    <div>
                                                        <div className="flex justify-between items-end mb-1.5">
                                                            <span className="text-[10px] text-[var(--color-text-tertiary)]">Medium</span>
                                                            <span className="text-xs font-semibold text-[var(--color-warning)]">{item.difficultyBreakdown.medium}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-[var(--color-bg-muted)] rounded-full overflow-hidden">
                                                            <div className="h-full bg-[var(--color-warning)] rounded-full" style={{ width: `${item.difficultyBreakdown.medium}%` }} />
                                                        </div>
                                                    </div>
                                                    {/* Hard */}
                                                    <div>
                                                        <div className="flex justify-between items-end mb-1.5">
                                                            <span className="text-[10px] text-[var(--color-text-secondary)]">Hard</span>
                                                            <span className="text-xs font-semibold text-[var(--color-error)]">{item.difficultyBreakdown.hard}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-[var(--color-bg-muted)] rounded-full overflow-hidden">
                                                            <div className="h-full bg-[var(--color-error)] rounded-full" style={{ width: `${item.difficultyBreakdown.hard}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="md:col-span-1 flex flex-col items-end justify-center md:pl-4">
                                                <div className="text-[10px] text-[var(--color-text-disabled)] uppercase mb-1">Consistency</div>
                                                <div className={`text-xs font-medium capitalize ${getConsistencyColor(item.consistency)}`}>
                                                    {item.consistency}
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })
                ) : (
                    <Placeholder
                        icon={ListChecks}
                        title="No Topic Data"
                        description="Try adjusting your filters or search query to find specific topic performance data."
                        className="border-none bg-transparent py-12"
                    />
                )}
            </div>
        </div>
    )
}

export default TopicPerformanceTable
