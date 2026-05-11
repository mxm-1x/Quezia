import React from 'react'
import { MagnifyingGlass, Funnel } from '@phosphor-icons/react'
import type { AnalyticsFilter } from './types'

interface Props {
    filters: AnalyticsFilter
    onFilterChange: (newFilters: AnalyticsFilter) => void
}

const AnalyticsHeader: React.FC<Props> = ({ filters, onFilterChange }) => {
    const [localSearch, setLocalSearch] = React.useState(filters.searchQuery)

    // Sync local state if external filters change
    React.useEffect(() => {
        setLocalSearch(filters.searchQuery)
    }, [filters.searchQuery])

    // Debounce the update to the parent for "live" feel
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== filters.searchQuery) {
                onFilterChange({ ...filters, searchQuery: localSearch })
            }
        }, 400) // 400ms delay for live feel

        return () => clearTimeout(timer)
    }, [localSearch, onFilterChange, filters])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSearch(e.target.value)
        if (!filters.isSearchActive) {
            onFilterChange({ ...filters, isSearchActive: true, searchQuery: e.target.value })
        }
    }

    const handleSearchFocus = () => {
        if (!filters.isSearchActive) {
            onFilterChange({ ...filters, isSearchActive: true })
        }
    }

    const handleClearSearch = () => {
        setLocalSearch('')
        onFilterChange({ ...filters, isSearchActive: false, searchQuery: '' })
    }

    return (
        <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Performance Analytics</h1>
                    <p className="text-neutral-400 text-sm mt-1">Track your progress and identify areas for improvement</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Search Bar */}
                    <div className="relative group flex-1 md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlass className="h-4 w-4 text-neutral-500 group-focus-within:text-white transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={localSearch}
                            onChange={handleSearchChange}
                            onFocus={handleSearchFocus}
                            placeholder="Search specific test..."
                            className="block w-full pl-10 pr-10 py-2 border border-white/10 rounded-xl leading-5 bg-white/5 text-white placeholder-neutral-500 focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-white/20 sm:text-sm transition-all"
                        />

                        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                            {filters.isSearchActive && (
                                <button
                                    onClick={handleClearSearch}
                                    className="px-2 py-1 hover:bg-white/10 rounded-lg transition-colors text-[10px] font-bold text-neutral-500 hover:text-white uppercase tracking-tighter"
                                >
                                    Exit
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Button */}
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white transition-all text-sm font-medium">
                        <Funnel className="h-4 w-4" />
                        <span>Filters</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AnalyticsHeader
