import React, { useState, useMemo } from 'react'
import { CaretDown, MagnifyingGlass, ArrowRight } from '@phosphor-icons/react'

interface QuestionAttempt {
    id: number
    section: string
    subject: string
    topic: string
    difficulty: 'easy' | 'medium' | 'hard'
    status: 'correct' | 'incorrect' | 'unattempted'
    marks: number
    time: number
}

interface Props {
    questions: QuestionAttempt[]
}

const QuestionReviewTable: React.FC<Props> = ({ questions }) => {
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'incorrect' | 'hard' | 'slow'>('all')
    const [sortConfig, setSortConfig] = useState<{ key: keyof QuestionAttempt, direction: 'asc' | 'desc' } | null>(null)

    const filteredQuestions = useMemo(() => {
        return questions.filter(q => {
            const matchSearch = q.topic.toLowerCase().includes(search.toLowerCase()) ||
                q.subject.toLowerCase().includes(search.toLowerCase())

            if (filter === 'incorrect') return matchSearch && q.status === 'incorrect'
            if (filter === 'hard') return matchSearch && q.difficulty === 'hard'
            if (filter === 'slow') return matchSearch && q.time > 180
            return matchSearch
        }).sort((a, b) => {
            if (!sortConfig) return 0
            const { key, direction } = sortConfig
            const factor = direction === 'asc' ? 1 : -1
            if (a[key] < b[key]) return -1 * factor
            if (a[key] > b[key]) return 1 * factor
            return 0
        })
    }, [questions, search, filter, sortConfig])

    const handleSort = (key: keyof QuestionAttempt) => {
        setSortConfig(prev => ({
            key,
            direction: prev?.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }))
    }

    return (
        <div className="bg-[var(--color-bg-surface)] backdrop-blur-md border border-[var(--color-border-default)] rounded-3xl overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="p-6 border-b border-[var(--color-border-default)] space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h3 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">Question Depth Review</h3>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                            <input
                                type="text"
                                placeholder="Search topic or subject..."
                                className="w-full bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent-subtle)] transition-colors"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All Questions</FilterButton>
                    <FilterButton active={filter === 'incorrect'} onClick={() => setFilter('incorrect')}>Mistakes Only</FilterButton>
                    <FilterButton active={filter === 'hard'} onClick={() => setFilter('hard')}>Hard Questions</FilterButton>
                    <FilterButton active={filter === 'slow'} onClick={() => setFilter('slow')}>Time Inefficient ({'>'}180s)</FilterButton>
                </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold border-b border-[var(--color-border-default)]">
                            <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('id')}>
                                <div className="flex items-center gap-1">
                                    # {sortConfig?.key === 'id' && <CaretDown className={sortConfig.direction === 'asc' ? 'rotate-180' : ''} />}
                                </div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('section')}>
                                <div className="flex items-center gap-1">
                                    Section {sortConfig?.key === 'section' && <CaretDown className={sortConfig.direction === 'asc' ? 'rotate-180' : ''} />}
                                </div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('subject')}>
                                <div className="flex items-center gap-1">
                                    Subject {sortConfig?.key === 'subject' && <CaretDown className={sortConfig.direction === 'asc' ? 'rotate-180' : ''} />}
                                </div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('topic')}>
                                <div className="flex items-center gap-1">
                                    Topic {sortConfig?.key === 'topic' && <CaretDown className={sortConfig.direction === 'asc' ? 'rotate-180' : ''} />}
                                </div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('difficulty')}>
                                <div className="flex items-center gap-1">
                                    Diff {sortConfig?.key === 'difficulty' && <CaretDown className={sortConfig.direction === 'asc' ? 'rotate-180' : ''} />}
                                </div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('status')}>Status</th>
                            <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('marks')}>Marks</th>
                            <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('time')}>
                                <div className="flex items-center gap-1">
                                    Time {sortConfig?.key === 'time' && <CaretDown className={sortConfig.direction === 'asc' ? 'rotate-180' : ''} />}
                                </div>
                            </th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-default)]">
                        {filteredQuestions.map((q, i) => (
                            <tr key={i} className="group hover:bg-[var(--color-bg-muted)] transition-colors">
                                <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-primary)]">#{q.id}</td>
                                <td className="px-6 py-4 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">{q.section}</td>
                                <td className="px-6 py-4 text-xs font-bold text-[var(--color-text-secondary)] uppercase">{q.subject}</td>
                                <td className="px-6 py-4 text-sm font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors uppercase tracking-tight">{q.topic}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${q.difficulty === 'easy' ? 'bg-[var(--color-success-subtle)] text-[var(--color-on-success)]' :
                                        q.difficulty === 'medium' ? 'bg-[var(--color-warning-subtle)] text-[var(--color-on-warning)]' : 'bg-[var(--color-error-subtle)] text-[var(--color-on-error)]'
                                        }`}>
                                        {q.difficulty}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`flex items-center gap-1.5 text-xs font-bold uppercase ${q.status === 'correct' ? 'text-[var(--color-success)]' :
                                        q.status === 'incorrect' ? 'text-[var(--color-error)]' : 'text-[var(--color-text-disabled)]'
                                        }`}>
                                        {q.status}
                                    </div>
                                </td>
                                <td className={`px-6 py-4 text-sm font-mono font-bold ${q.marks > 0 ? 'text-[var(--color-success)]' : q.marks < 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-tertiary)]'
                                    }`}>
                                    {q.marks > 0 ? `+${q.marks}` : q.marks}
                                </td>
                                <td className={`px-6 py-4 text-sm font-mono font-medium ${q.time > 180 ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-secondary)]'}`}>
                                    {q.time}s
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 rounded-lg bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)] transition-all opacity-0 group-hover:opacity-100">
                                        <ArrowRight size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const FilterButton = ({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${active ? 'bg-[rgba(255,255,255,0.15)] text-[var(--color-text-primary)] shadow-lg shadow-[var(--color-bg-muted)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]'
            }`}
    >
        {children}
    </button>
)

export default QuestionReviewTable
