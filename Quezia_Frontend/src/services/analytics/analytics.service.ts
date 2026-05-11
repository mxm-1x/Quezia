import { apiClient } from '../api';

export interface ExamAnalytics {
    exam: { id: string; name: string; isActive: boolean };
    tests: number;
    threads: number;
    blueprints: number;
    activeSubscriptions: number;
    attempts: { total: number; avgScore: number; avgAccuracy: number; avgTimeSeconds: number };
}

export const analyticsService = {
    getExamAnalytics: async (examId: string): Promise<ExamAnalytics> => {
        const response = await apiClient.get<ExamAnalytics>(`/admin/analytics/exam/${examId}`);
        return response.data;
    },

    // Add more learner-facing analytics methods here as needed
};
