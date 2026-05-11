import { testEngineService } from './test-engine/test-engine.service'
import type {
    AnalyticsFilter,
    MetricCardData
} from '../components/Dashboard/Analytics/types'

// --------------------------------------------------------------------------
// Main Export
// --------------------------------------------------------------------------

export const analyticsService = {
    fetchAnalyticsDashboardData: async (filter: AnalyticsFilter) => {
        // Fetch all attempts from backend
        const allAttempts = await testEngineService.getAttempts()
        const completedAttempts = allAttempts.filter(a => a.status === 'COMPLETED')

        // Fetch all threads to get titles (simplification: in production you'd join this)
        // Map to the internal TestAttempt type or what the UI expects
        // For now, we'll map directly in the response if needed or just update the UI
        // But SearchResultsGrid expects the MockDatabase's TestAttempt type.
        // Let's create a compatible version.

        const mappedAttempts = completedAttempts.map(a => {
            // Find thread for title
            // Note: Attempt has testId, but we need threadId to get Title easily if it follows our structure
            // Actually Attempt -> Test -> Thread
            // For now, we might need to fetch the Test for each effort if we want full details.
            // But let's see if we can get by with what we have.

            return {
                ...a,
                score: a.totalScore ?? 0,
                // Mock totalMarks to something reasonable if not available
                totalMarks: 300,
                accuracy: a.accuracy ?? 0,
                timeTakenMinutes: Math.round((a.timeSpentSeconds ?? 0) / 60),
                createdAt: a.completedAt || a.startedAt,
                // Mock questionAttempts as empty for now to avoid crashes
                questionAttempts: []
            }
        })

        // Filter based on UI filters (search query)
        let filtered = mappedAttempts
        if (filter.searchQuery) {
            const query = filter.searchQuery.toLowerCase()
            // We can only search ID or basic stats unless we fetch Test/Thread info
            filtered = mappedAttempts.filter(a =>
                a.id.toLowerCase().includes(query) ||
                a.testId.toLowerCase().includes(query)
            )
        }

        // Simplified Metrics
        const metrics: MetricCardData[] = [
            {
                id: '1',
                label: 'Overall Accuracy',
                value: `${Math.round(completedAttempts.reduce((acc, a) => acc + (a.accuracy ?? 0), 0) / (completedAttempts.length || 1))}%`,
                metricDirection: 'increase_is_good',
                color: '[#EC2801]',
            },
            {
                id: '2',
                label: 'Total Attempts',
                value: String(completedAttempts.length),
                metricDirection: 'increase_is_good',
                color: '[#F97316]'
            }
        ]

        // Other charts are on hold
        return {
            metrics,
            performanceData: [],
            subjectData: [],
            topicData: [],
            timeData: [],
            rankData: [],
            insights: ["Backend connection active. Detailed charts are coming soon."],
            filteredAttempts: filtered
        }
    }
}
