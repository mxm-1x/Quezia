import React, { useState, useMemo } from 'react'
import { MagnifyingGlass, SortAscending, SortDescending, Funnel, CaretLeft, CaretRight } from '@phosphor-icons/react'
import SectionStrip from '../../../common/SectionStrip'
import { BlockDropdown, type DropdownOption } from '../../../common/Dropdown'
import TestListCard, { type TestCardData, type TestStatus } from './TestListCard'
import { useTests } from '../../../../hooks/useTests'
import { useAuth } from '../../../../hooks/useAuth'
import LoadingSpinner from '../../../common/LoadingSpinner'

type SortOption = 'date-desc' | 'date-asc' | 'marks-desc' | 'marks-asc'
type FilterOption = 'all' | 'completed' | 'in-progress' | 'not-started'

const ITEMS_PER_PAGE = 5

const YourTestsSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)

  const { threads, attempts, isLoading } = useTests()
  const auth = useAuth()

  const testCardData: TestCardData[] = useMemo(() => {
    const { user } = auth || {}

    return threads
      .filter((thread) => {
        if (user?.role === 'ADMIN') return true
        return thread.createdByUserId === user?.id && thread.originType !== 'SYSTEM'
      })
      .map((thread) => {
        // Find the most recent attempt for this thread
        const threadAttempts = attempts.filter((a) => a.testId.startsWith(thread.id))
        const latestAttempt = [...threadAttempts].sort(
          (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        )[0]

        let status: TestStatus = 'GENERATED'
        if (latestAttempt) {
          status = latestAttempt.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS'
        }

        return {
          id: thread.id,
          title: thread.title,
          subject:
            (thread.baseGenerationConfig as { subjects?: string[] }).subjects?.[0] || 'General',
          status,
          totalQuestions: 0,
          attemptedQuestions: 0,
          score: latestAttempt?.totalScore ?? undefined,
          totalMarks: 0,
          createdAt: thread.createdAt,
          lastInteractedAt: latestAttempt?.startedAt || thread.createdAt,
        }
      })
  }, [threads, attempts, auth])

  // Filter and sort tests
  const filteredTests = useMemo(() => {
    let result = [...testCardData]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (test) =>
          test.title.toLowerCase().includes(query) ||
          test.subject.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (filterBy !== 'all') {
      const statusMap: Record<FilterOption, TestStatus | null> = {
        all: null,
        completed: 'COMPLETED',
        'in-progress': 'IN_PROGRESS',
        'not-started': 'GENERATED',
      }
      const targetStatus = statusMap[filterBy]
      if (targetStatus) {
        result = result.filter((test) => test.status === targetStatus)
      }
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'marks-desc':
          return (b.score ?? 0) - (a.score ?? 0)
        case 'marks-asc':
          return (a.score ?? 0) - (b.score ?? 0)
        default:
          return 0
      }
    })

    return result
  }, [testCardData, searchQuery, sortBy, filterBy])

  // Pagination
  const totalPages = Math.ceil(filteredTests.length / ITEMS_PER_PAGE)
  const paginatedTests = filteredTests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset to first page when filters change
  const handleFilterChange = (filter: FilterOption) => {
    setFilterBy(filter)
    setCurrentPage(1)
  }

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort)
    setCurrentPage(1)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const sortOptions: DropdownOption<SortOption>[] = [
    { value: 'date-desc', label: 'Newest first' },
    { value: 'date-asc', label: 'Oldest first' },
    { value: 'marks-desc', label: 'Marks (high to low)' },
    { value: 'marks-asc', label: 'Marks (low to high)' },
  ]

  const filterOptions: DropdownOption<FilterOption>[] = [
    { value: 'all', label: 'All tests' },
    { value: 'completed', label: 'Completed' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'not-started', label: 'Not started' },
  ]

  // Actions for the section header
  const actions = (
    <span className="text-xs text-[var(--color-text-tertiary)]">
      {filteredTests.length} test{filteredTests.length !== 1 ? 's' : ''}
    </span>
  )

  return (
    <SectionStrip title="Your tests" actions={actions}>
      {/* Search and filters row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search input */}
        <div className="relative flex-1">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-disabled)]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search your tests..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-base)] text-sm text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-disabled)] focus:border-[var(--color-accent-subtle)] focus:outline-none transition"
          />
        </div>

        {/* Sort dropdown */}
        <BlockDropdown
          options={sortOptions}
          value={sortBy}
          onChange={handleSortChange}
          isOpen={isSortOpen}
          setIsOpen={(open) => {
            setIsSortOpen(open)
            if (open) setIsFilterOpen(false)
          }}
          icon={sortBy.includes('asc') ? <SortAscending size={14} /> : <SortDescending size={14} />}
          popupWidth="w-44"
        />

        {/* Filter dropdown */}
        <BlockDropdown
          options={filterOptions}
          value={filterBy}
          onChange={handleFilterChange}
          isOpen={isFilterOpen}
          setIsOpen={(open) => {
            setIsFilterOpen(open)
            if (open) setIsSortOpen(false)
          }}
          icon={<Funnel size={14} />}
          showActiveStyle
          popupWidth="w-40"
        />
      </div>

      {/* Tests list */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="py-20 flex items-center justify-center">
            <LoadingSpinner message="Loading your tests..." />
          </div>
        ) : paginatedTests.length > 0 ? (
          paginatedTests.map((test) => <TestListCard key={test.id} test={test} />)
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-[var(--color-text-tertiary)]">No tests found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs text-[var(--color-text-disabled)] hover:text-[var(--color-text-secondary)] underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-border-default)]">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Page {currentPage} of {totalPages}
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-disabled)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-secondary)] disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <CaretLeft size={14} />
            </button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-sm transition ${page === currentPage
                  ? 'bg-[var(--color-bg-muted)] text-[var(--color-text-primary)] border border-[var(--color-border-default)]'
                  : 'text-[var(--color-text-disabled)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]'
                  }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-disabled)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-secondary)] disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <CaretRight size={14} />
            </button>
          </div>
        </div>
      )}
    </SectionStrip>
  )
}

export default YourTestsSection
