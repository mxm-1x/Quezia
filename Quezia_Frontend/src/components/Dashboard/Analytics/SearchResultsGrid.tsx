import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Calendar,
    TrendUp,
    TrendDown,
    ArrowRight,
    Target,
    List,
    SquaresFour,
    CaretLeft,
    CaretRight,
    ArrowUp,
    ArrowDown,
    ChartLineUp,
    Star,
    Trophy
} from '@phosphor-icons/react'

interface Props {
    attempts: any[]
    searchQuery: string
    onExit: () => void
}

type ViewMode = 'list' | 'card'
type FilterType = 'all' | 'full' | 'chapter' | 'subject'
type FilterSubject = 'all' | 'physics' | 'chemistry' | 'maths'
type SortKey = 'date' | 'score' | 'accuracy' | 'time' | 'delta'

interface SortConfig {
    key: SortKey
    direction: 'asc' | 'desc'
}

const SearchResultsGrid: React.FC<Props> = ({ attempts, searchQuery, onExit }) => {
    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------
    const [viewMode, setViewMode] = useState<ViewMode>('list')
    const [filterType, setFilterType] = useState<FilterType>('all')
    const [filterSubject, setFilterSubject] = useState<FilterSubject>('all')
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' })
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 25

    // -------------------------------------------------------------------------
    // Relevance Scoring Logic
    // -------------------------------------------------------------------------
    const calculateRelevance = (attempt: any, query: string): number => {
        if (!query) return 0
        const q = query.toLowerCase()
        const title = (attempt.title || '').toLowerCase()
        const subject = (attempt.subject || '').toLowerCase()

        let score = 0
        if (title.includes(q)) score += 6
        if (subject.includes(q)) score += 4
        return score
    }

    // -------------------------------------------------------------------------
    // Filtering & Sorting Logic
    // -------------------------------------------------------------------------
    const processedData = useMemo(() => {
        let filtered = [...attempts]

        // 1. Apply Filters
        if (filterSubject !== 'all') {
            filtered = filtered.filter(a => {
                return (a.subject || '').toLowerCase().includes(filterSubject === 'maths' ? 'mathematics' : filterSubject)
            })
        }

        // 2. Pre-calculate Relevance Scores
        const itemsWithScore = filtered.map(a => ({
            attempt: a,
            relevance: calculateRelevance(a, searchQuery)
        }))

        // 3. Apply Sorting
        itemsWithScore.sort((a, b) => {
            // If searching, prioritize relevance first
            if (searchQuery) {
                if (b.relevance !== a.relevance) return b.relevance - a.relevance
                // Tie-breaker: Date descending
                return new Date(b.attempt.createdAt).getTime() - new Date(a.attempt.createdAt).getTime()
            }

            // Normal sorting
            const { key, direction } = sortConfig
            const factor = direction === 'asc' ? 1 : -1

            let comparison = 0
            if (key === 'date') comparison = new Date(a.attempt.createdAt).getTime() - new Date(b.attempt.createdAt).getTime()
            else if (key === 'score') comparison = a.attempt.score - b.attempt.score
            else if (key === 'accuracy') comparison = a.attempt.accuracy - b.attempt.accuracy
            else if (key === 'time') comparison = a.attempt.timeTakenMinutes - b.attempt.timeTakenMinutes
            // delta mocked as 0 for sorting if not available

            if (comparison === 0) {
                // Secondary fallback: Date DESC
                return new Date(b.attempt.createdAt).getTime() - new Date(a.attempt.createdAt).getTime()
            }
            return comparison * factor
        })

        return itemsWithScore.map(i => i.attempt)
    }, [attempts, searchQuery, filterSubject, sortConfig])

    // Pagination
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return processedData.slice(start, start + pageSize)
    }, [processedData, currentPage])

    const totalPages = Math.ceil(processedData.length / pageSize)

    // -------------------------------------------------------------------------
    // Summary Stats
    // -------------------------------------------------------------------------
    const stats = useMemo(() => {
        if (attempts.length === 0) return null
        const total = attempts.length
        const avgScore = Math.round(attempts.reduce((acc, a) => acc + a.score, 0) / total)
        const avgTotal = Math.round(attempts.reduce((acc, a) => acc + a.totalMarks, 0) / total)
        const bestScore = Math.max(...attempts.map(a => a.score))
        return { total, avgScore, avgTotal, bestScore }
    }, [attempts])

    const handleSort = (key: SortKey) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }))
    }

    if (attempts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-white">No attempts recorded yet</h3>
                <p>Start a test to see your analytics here.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Summary Stats Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <ChartLineUp size={24} />
                    </div>
                    <div>
                        <div className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Avg Score</div>
                        <div className="text-xl font-bold text-white">{stats?.avgScore} <span className="text-xs text-neutral-500 font-normal">/ {stats?.avgTotal}</span></div>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <div className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Best Performance</div>
                        <div className="text-xl font-bold text-white">{stats?.bestScore}</div>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                        <Target size={24} />
                    </div>
                    <div>
                        <div className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Total Tests</div>
                        <div className="text-xl font-bold text-white">{stats?.total}</div>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Star size={24} />
                    </div>
                    <div>
                        <div className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Current Streak</div>
                        <div className="text-xl font-bold text-white">12 <span className="text-xs text-neutral-500 font-normal">days</span></div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5 backdrop-blur-sm sticky top-0 z-10 shadow-xl shadow-black/20">
                <div className="flex flex-wrap items-center gap-6">
                    {/* View Toggle */}
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            <List size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('card')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            <SquaresFour size={20} />
                        </button>
                    </div>

                    <div className="h-6 w-px bg-white/10"></div>

                    {/* Type Filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase text-neutral-500 tracking-widest mr-1">Type:</span>
                        {(['all', 'full', 'chapter', 'subject'] as FilterType[]).map(type => (
                            <button
                                key={type}
                                onClick={() => { setFilterType(type); setCurrentPage(1); }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-tight transition-all ${filterType === type ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-400'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <div className="h-4 w-px bg-white/5 hidden sm:block"></div>

                    {/* Subject Filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase text-neutral-500 tracking-widest mr-1">Subject:</span>
                        {(['all', 'physics', 'chemistry', 'maths'] as FilterSubject[]).map(sub => (
                            <button
                                key={sub}
                                onClick={() => { setFilterSubject(sub); setCurrentPage(1); }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-tight transition-all ${filterSubject === sub ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-400'}`}
                            >
                                {sub}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4 self-stretch lg:self-auto">
                    <div className="text-xs text-neutral-500 font-medium">
                        Showing <span className="text-white">{processedData.length}</span> results
                    </div>
                    <button
                        onClick={onExit}
                        className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase text-neutral-400 hover:bg-white/10 hover:text-white transition-all tracking-wider ml-2"
                    >
                        Return to Overview
                    </button>
                </div>
            </div>

            {/* Content View */}
            {viewMode === 'list' ? (
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-[10px] uppercase tracking-widest font-bold text-neutral-400">
                                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('date')}>
                                        <div className="flex items-center gap-1">
                                            Date {sortConfig.key === 'date' && (sortConfig.direction === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">Test Name</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('score')}>
                                        <div className="flex items-center gap-1">
                                            Score {sortConfig.key === 'score' && (sortConfig.direction === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">Δ</th>
                                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('accuracy')}>
                                        <div className="flex items-center gap-1">
                                            Acc {sortConfig.key === 'accuracy' && (sortConfig.direction === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('time')}>
                                        <div className="flex items-center gap-1">
                                            Time {sortConfig.key === 'time' && (sortConfig.direction === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">Att</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {paginatedData.map(attempt => (
                                    <ListItem key={attempt.id} attempt={attempt} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedData.map(attempt => (
                        <AttemptCard
                            key={attempt.id}
                            attempt={attempt}
                            isFullSyllabus={false}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                    <div className="text-xs text-neutral-500">
                        Page <span className="text-white font-bold">{currentPage}</span> of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-2 rounded-lg bg-white/5 border border-white/10 text-neutral-400 disabled:opacity-30 hover:bg-white/10 transition-colors"
                        >
                            <CaretLeft size={16} />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum = i + 1;
                                if (totalPages > 5 && currentPage > 3) {
                                    pageNum = currentPage - 3 + i + 1;
                                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-white/20 text-white' : 'text-neutral-500 hover:bg-white/5'}`}
                                    >
                                        {pageNum}
                                    </button>
                                )
                            })}
                        </div>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-2 rounded-lg bg-white/5 border border-white/10 text-neutral-400 disabled:opacity-30 hover:bg-white/10 transition-colors"
                        >
                            <CaretRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

const ListItem: React.FC<{ attempt: any }> = ({ attempt }) => {
    const navigate = useNavigate()
    const title = attempt.title || `Attempt ${attempt.id.substring(0, 8)}`
    const date = new Date(attempt.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    })


    const scoreColor = attempt.accuracy >= 80 ? 'text-blue-400' :
        attempt.accuracy >= 65 ? 'text-green-400' :
            attempt.accuracy >= 45 ? 'text-yellow-400' : 'text-red-400'

    const trend = useMemo(() => {
        const hash = (attempt.id || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
        return hash % 2 === 0 ? { val: 12, pos: true } : { val: 8, pos: false }
    }, [attempt.id])

    return (
        <tr
            onClick={() => navigate(`/dashboard/analytics/attempt/${attempt.id}`)}
            className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
        >
            <td className="px-6 py-4 text-xs text-neutral-500 font-medium">{date}</td>
            <td className="px-6 py-4">
                <div className="text-sm font-semibold text-white line-clamp-1 group-hover:text-blue-400 transition-colors">{title}</div>
            </td>
            <td className="px-6 py-4">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white/5 text-neutral-500">
                    {attempt.subject || 'Test'}
                </span>
            </td>
            <td className={`px-6 py-4 font-bold text-sm ${scoreColor}`}>
                {attempt.score}<span className="text-[10px] opacity-40 font-normal">/{attempt.totalMarks}</span>
            </td>
            <td className="px-6 py-4 text-xs font-bold">
                <div className={`flex items-center gap-0.5 ${trend.pos ? 'text-green-400' : 'text-red-400'}`}>
                    {trend.pos ? '+' : '↓'}{trend.val}
                </div>
            </td>
            <td className="px-6 py-4 text-sm font-medium text-neutral-300">{attempt.accuracy}%</td>
            <td className="px-6 py-4 text-sm font-medium text-neutral-300">{attempt.timeTakenMinutes}m</td>
            <td className="px-6 py-4 text-xs text-neutral-400 font-bold">Done</td>
            <td className="px-6 py-4 text-right">
                <ArrowRight size={14} className="text-neutral-700 group-hover:text-blue-400 transition-all group-hover:translate-x-1" />
            </td>
        </tr>
    )
}

const AttemptCard: React.FC<{ attempt: any; isFullSyllabus: boolean }> = ({ attempt, isFullSyllabus }) => {
    const navigate = useNavigate()
    const title = attempt.title || `Attempt ${attempt.id.substring(0, 8)}`
    const date = new Date(attempt.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })


    // Performance Color Logic (Percentage based)
    const getPerformanceColor = (accuracy: number) => {
        if (accuracy >= 80) return {
            bg: 'bg-blue-500/10',
            text: 'text-blue-400',
            border: 'border-blue-500/30',
        }
        if (accuracy >= 65) return {
            bg: 'bg-green-500/10',
            text: 'text-green-400',
            border: 'border-green-500/30',
        }
        if (accuracy >= 45) return {
            bg: 'bg-yellow-500/10',
            text: 'text-yellow-400',
            border: 'border-yellow-500/30',
        }
        return {
            bg: 'bg-red-500/10',
            text: 'text-red-400',
            border: 'border-red-500/30',
        }
    }

    const colors = getPerformanceColor(attempt.accuracy)
    const trend = useMemo(() => {
        const hash = (attempt.id || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
        return hash % 2 === 0 ? { value: 12, type: 'up' } : { value: 8, type: 'down' }
    }, [attempt.id])

    return (
        <div
            onClick={() => navigate(`/dashboard/analytics/attempt/${attempt.id}`)}
            className={`group relative flex flex-col justify-between p-6 bg-white/5 border ${isFullSyllabus ? 'border-white/20 p-7' : 'border-white/10'} rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/40 cursor-pointer overflow-hidden`}
        >
            {/* Background Accent */}
            <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full blur-[64px] transition-opacity duration-500 opacity-20 group-hover:opacity-40 ${colors.bg}`}></div>

            <div className="relative">
                <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg leading-tight line-clamp-2 mb-1" title={title}>
                            {title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-neutral-500">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{date}</span>
                            </div>
                            <span>•</span>
                            <span className="font-medium">{attempt.subject || 'Test'}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <div className={`px-4 py-2 rounded-xl border-2 ${colors.border} ${colors.bg} ${colors.text} group-hover:scale-105 transition-transform duration-300`}>
                            <div className="text-2xl font-bold tracking-tighter leading-none">{attempt.score}</div>
                            <div className="text-[10px] font-bold opacity-60 text-center uppercase tracking-wider">/ {attempt.totalMarks}</div>
                        </div>
                        <div className={`mt-2 flex items-center gap-1 text-[11px] font-medium ${trend.type === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                            {trend.type === 'up' ? <TrendUp weight="bold" /> : <TrendDown weight="bold" />}
                            <span>{trend.type === 'up' ? '+' : '↓ -'}{trend.value} from last</span>
                        </div>
                    </div>
                </div>

                {/* Performance Strip */}
                <div className="mt-6 py-3 px-4 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between text-neutral-300">
                    <div className="flex flex-col items-center flex-1">
                        <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-0.5">Accuracy</span>
                        <span className="text-sm font-medium text-white">{attempt.accuracy}%</span>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="flex flex-col items-center flex-1">
                        <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-0.5">Time</span>
                        <span className="text-sm font-medium text-white">{attempt.timeTakenMinutes}m</span>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="flex flex-col items-center flex-1">
                        <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-0.5">Status</span>
                        <span className="text-sm font-medium text-white">Done</span>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-neutral-500 group-hover:text-blue-400 transition-colors">
                <div className="flex items-center gap-2 text-xs font-medium">
                    <Target className="h-3.5 w-3.5" />
                    <span>View depth analysis</span>
                </div>
                <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
            </div>
        </div>
    )
}

export default SearchResultsGrid
