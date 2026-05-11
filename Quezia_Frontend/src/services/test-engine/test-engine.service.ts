import { apiClient } from '../api';
import type { Section, Rule } from '../exam-setup/exam-setup.service';

export interface TestThread {
    id: string;
    examId: string;
    originType: 'SYSTEM' | 'GENERATED';
    createdByUserId: string | null;
    title: string;
    baseGenerationConfig: Record<string, unknown>;
    createdAt: string;
}

export interface TestQuestion {
    id: string;
    testId: string;
    sectionId: string;
    questionId: string;
    version: number;
    subject: string;
    topic: string;
    subtopic: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    questionType: 'MCQ' | 'NUMERIC';
    contentPayload: {
        question: string;
        options?: { key: string; text: string }[];
    };
    correctAnswer: string;
    explanation: string;
    marks: number;
    sequence: number;
}

export interface Test {
    id: string;
    threadId: string;
    versionNumber: number;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    sectionSnapshot: (Section & { id: string })[];
    ruleSnapshot: Rule;
    totalQuestions: number;
    createdAt: string;
}

export interface Attempt {
    id: string;
    testId: string;
    userId: string;
    status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
    startedAt: string;
    completedAt: string | null;
    totalScore: number | null;
    accuracy: number | null;
    timeSpentSeconds: number | null;
    riskRatio?: number;
    percentile?: number;
    userRank?: number;
}

// ---------- Attempt Review Types ----------

export interface ReviewQuestion {
    id: string | null;
    questionId: string;
    sequence: number;
    subject: string;
    topic: string;
    difficulty: string;
    questionType: 'MCQ' | 'NUMERIC';
    contentPayload: {
        question: string;
        options?: { key: string; text: string }[];
    } | null;
    marks: number;
    negativeMarkValue: number;
    selectedAnswer: string | null;
    correctAnswer: string;
    isCorrect: boolean | null;
    marksAwarded: number | null;
    explanation: string | null;
    timeSpentSeconds: number | null;
    status: 'CORRECT' | 'INCORRECT' | 'UNATTEMPTED';
}

export interface AttemptReviewResponse {
    attempt: {
        id: string;
        testId: string;
        threadId?: string;
        status: string;
        startedAt: string;
        completedAt: string | null;
        totalScore: number | null;
        accuracy: number | null;
        percentile: number | null;
        userRank: number | null;
        timeSpentSeconds: number | null;
        riskRatio: number | null;
    };
    summary: {
        totalQuestions: number;
        attempted: number;
        correct: number;
        incorrect: number;
        unattempted: number;
        totalScore: number | null;
        maxScore: number | null;
    };
    questions: ReviewQuestion[];
}

export const testEngineService = {
    // Threads
    getThreads: async (): Promise<TestThread[]> => {
        const response = await apiClient.get<TestThread[]>('/test-threads');
        return response.data;
    },

    createThread: async (data: { examId: string; originType: string; title: string; baseGenerationConfig: any }): Promise<TestThread> => {
        const response = await apiClient.post<TestThread>('/test-threads', data);
        return response.data;
    },

    getThread: async (id: string): Promise<TestThread> => {
        const response = await apiClient.get<TestThread>(`/test-threads/${id}`);
        return response.data;
    },

    getLatestVersion: async (threadId: string): Promise<Test> => {
        const response = await apiClient.get<Test>(`/test-threads/${threadId}/latest`);
        return response.data;
    },

    // Versions
    generateVersion: async (threadId: string, data: { followsBlueprint?: boolean; blueprintReferenceId?: string; prompt?: string }): Promise<Test> => {
        const response = await apiClient.post<Test>(`/test-threads/${threadId}/generate`, data);
        return response.data;
    },

    getTest: async (id: string): Promise<Test> => {
        const response = await apiClient.get<Test>(`/tests/${id}`);
        return response.data;
    },

    publishTest: async (id: string): Promise<Test> => {
        const response = await apiClient.patch<Test>(`/tests/${id}/publish`);
        return response.data;
    },

    archiveTest: async (id: string): Promise<Test> => {
        const response = await apiClient.patch<Test>(`/tests/${id}/archive`);
        return response.data;
    },

    // Questions
    injectQuestions: async (testId: string, data: { sectionId: string; questions: Partial<TestQuestion>[] }): Promise<void> => {
        await apiClient.post(`/tests/${testId}/questions`, data);
    },

    getTestQuestions: async (testId: string): Promise<TestQuestion[]> => {
        const response = await apiClient.get<TestQuestion[]>(`/tests/${testId}/questions`);
        return response.data;
    },

    // Attempts
    startAttempt: async (testId: string): Promise<Attempt> => {
        const response = await apiClient.post<Attempt>(`/attempts/${testId}/start`);
        return response.data;
    },

    getAttempt: async (id: string): Promise<Attempt> => {
        const response = await apiClient.get<Attempt>(`/attempts/${id}`);
        return response.data;
    },

    getAttemptQuestions: async (attemptId: string): Promise<TestQuestion[]> => {
        const response = await apiClient.get<TestQuestion[]>(`/attempts/${attemptId}/questions`);
        return response.data;
    },

    submitAnswer: async (attemptId: string, data: { questionId: string; answer: string; timeSpentSeconds?: number }): Promise<void> => {
        await apiClient.post(`/attempts/${attemptId}/submit`, data);
    },

    submitTest: async (attemptId: string): Promise<Attempt> => {
        const response = await apiClient.post<Attempt>(`/attempts/${attemptId}/submit-test`);
        return response.data;
    },

    getAttempts: async (threadId?: string): Promise<Attempt[]> => {
        const url = threadId ? `/attempts?threadId=${threadId}` : '/attempts';
        const response = await apiClient.get<Attempt[]>(url);
        return response.data;
    },

    // Review (single endpoint for full attempt analytics)
    getAttemptReview: async (attemptId: string): Promise<AttemptReviewResponse> => {
        const response = await apiClient.get<AttemptReviewResponse>(`/attempts/${attemptId}/review`);
        return response.data;
    },

    deleteThread: async (id: string): Promise<void> => {
        await apiClient.delete(`/test-threads/${id}`);
    },
};
