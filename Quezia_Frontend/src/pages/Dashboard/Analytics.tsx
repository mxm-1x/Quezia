import { useState, useEffect } from 'react'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { analyticsService } from '../../services/analytics'
import AnalyticsHeader from '../../components/Dashboard/Analytics/AnalyticsHeader'
import MetricsRow from '../../components/Dashboard/Analytics/MetricsRow'
import AnalyticsGrid from '../../components/Dashboard/Analytics/AnalyticsGrid'
import SearchResultsGrid from '../../components/Dashboard/Analytics/SearchResultsGrid' // Import new component
import CompareModeToggle, { type CompareMode } from '../../components/Dashboard/Analytics/CompareModeToggle'
import type { AnalyticsFilter, MetricCardData, PerformanceTrendPoint, RankComparisonPoint, SubjectMastery, TopicHealth, TimeEfficiencyPoint } from '../../components/Dashboard/Analytics/types'
import type { TestAttempt } from '../../services/mockDatabase' // Import TestAttempt type

const Analytics = () => {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [filters, setFilters] = useState<AnalyticsFilter>({
    subject: [],
    dateRange: 'month',
    testType: 'all',
    difficulty: 'all',
    searchQuery: '',
    isSearchActive: false
  })

  const [compareMode, setCompareMode] = useState<CompareMode>('personal')
  const [loading, setLoading] = useState(true)

  // Data State
  const [data, setData] = useState<{
    metrics: MetricCardData[]
    performanceData: PerformanceTrendPoint[]
    rankData: RankComparisonPoint[]
    subjectData: SubjectMastery[]
    timeData: TimeEfficiencyPoint[]
    topicData: TopicHealth[]
    insights: string[]
    filteredAttempts: TestAttempt[] // Add filteredAttempts to state
  }>({
    metrics: [],
    performanceData: [],
    rankData: [],
    subjectData: [],
    timeData: [],
    topicData: [],
    insights: [],
    filteredAttempts: []
  })

  // -------------------------------------------------------------------------
  // Data Fetching
  // -------------------------------------------------------------------------

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const dashboardData = await analyticsService.fetchAnalyticsDashboardData(filters)
        setData(dashboardData)
      } catch (error) {
        // Failed to load analytics data - handle silently
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [filters]) // Re-fetch when filters change


  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] px-6 py-8 md:px-10 md:py-12 font-sans text-[var(--color-text-secondary)]">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header & Filters */}
        <AnalyticsHeader filters={filters} onFilterChange={setFilters} />

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <LoadingSpinner message="Updating analytics..." />
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Conditional Rendering: Search Mode vs Dashboard Mode */}
            {filters.isSearchActive ? (
              <SearchResultsGrid
                attempts={data.filteredAttempts}
                searchQuery={filters.searchQuery}
                onExit={() => setFilters(prev => ({ ...prev, isSearchActive: false, searchQuery: '' }))}
              />
            ) : (
              <>
                {/* Top Row: Metrics & Compare Toggle */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-medium text-white">Overview</h2>
                    <CompareModeToggle mode={compareMode} onChange={setCompareMode} />
                  </div>
                  <MetricsRow metrics={data.metrics} />
                </div>

                {/* Charts Grid */}
                <AnalyticsGrid
                  performanceData={data.performanceData}
                  rankData={data.rankData}
                  subjectData={data.subjectData}
                  timeData={data.timeData}
                  topicData={data.topicData}
                  insights={data.insights}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Analytics