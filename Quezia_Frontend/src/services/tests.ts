import { MockDatabase, dbRequest, type TestAttempt, type TestVersion } from './mockDatabase'
import type { TestConfig } from '../types/test'

export const testsService = {
    getTestThread: async (threadId: string): Promise<TestConfig | undefined> => {
        return dbRequest(() => {
            // For now, return the single mock test regardless of ID, or strictly check ID
            // The mockDB has 'test-1'. If threadId is something else, we might want to return 'test-1' for demo.
            const test = MockDatabase.getTest(threadId)
            return test
        })
    },

    getAttempts: async (threadId: string): Promise<TestAttempt[]> => {
        return dbRequest(() => {
            // Similarly, return attempts for 'test-1' if threadId doesn't match, or filter by threadId
            // In this demo, we assume the user is viewing the 'test-1' thread equivalent
            const attempts = MockDatabase.getAttemptsForTest(threadId)
            return attempts
        })
    },

    getVersions: async (threadId: string): Promise<TestVersion[]> => {
        // threadId is unused in this mock implementation
        return dbRequest(() => {
            if (!threadId) return []
            return [
                { id: 'v3', label: 'v3', createdAt: 'Feb 10 · 14:32' },
                { id: 'v2', label: 'v2', createdAt: 'Feb 10 · 13:05' },
                { id: 'v1', label: 'v1', createdAt: 'Feb 10 · 12:10' },
            ]
        })
    }
}
