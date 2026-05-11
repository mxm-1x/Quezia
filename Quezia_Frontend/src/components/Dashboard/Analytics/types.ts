export interface AnalyticsFilter {
    subject: string[]
    dateRange: 'week' | 'month' | 'year' | 'all'
    testType: 'all' | 'mock' | 'previous-year' | 'chapter-wise'
    difficulty: 'all' | 'easy' | 'medium' | 'hard'
    searchQuery: string
    isSearchActive: boolean
}

export interface MetricCardData {
    id: string
    label: string
    value: string | number
    trend?: {
        value: number
        direction: 'up' | 'down' | 'neutral'
        label: string // e.g., "vs last month"
    }
    /** Determines which color a trend gets: green or red.
     *  'increase_is_good' → up=green, down=red (accuracy, score)
     *  'decrease_is_good' → down=green, up=red  (time, rank)  */
    metricDirection?: 'increase_is_good' | 'decrease_is_good'
    icon?: React.ReactNode
    color?: string // Tailwind class or hex
}

export interface PerformanceTrendPoint {
    date: string
    score: number
    totalMarks: number
    accuracy: number
    percentile: number
}

export interface SubjectMastery {
    subject: string
    accuracy: number
    avgMark: number // average marks scored out of total
    attempted: number
    totalQuestions: number
    color: string
}

export interface TopicHealth {
    topic: string
    subject: string
    accuracy: number
    attempted: number       // questions attempted
    totalAvailable: number  // total questions for this topic
    avgTimePerQ: number     // seconds
    negativeRate: number    // % of negative marking hits
    trendDelta: number      // pp change vs previous window
    consistency: 'stable' | 'volatile' | 'improving' | 'declining'
    lastTestedDate: string  // ISO date
    difficultyBreakdown: { easy: number; medium: number; hard: number } // accuracy by difficulty
    weightage: number
    status: 'strong' | 'moderate' | 'weak'
}

export interface RankComparisonPoint {
    testId: string
    studentRank: number
    totalCandidates: number
    percentile: number
    avgRank: number
}

export interface TimeEfficiencyPoint {
    timeSpent: number
    accuracy: number
    testId: string
    difficulty: 'easy' | 'medium' | 'hard'
}
