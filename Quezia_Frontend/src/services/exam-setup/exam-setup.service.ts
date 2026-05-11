import { apiClient } from '../api';

export interface Exam {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: string;
    _count?: {
        blueprints: number;
    };
}

export interface Section {
    subject: string;
    sequence: number;
    sectionDurationSeconds?: number;
    questionCount: number;
    marksPerQuestion: number;
}

export interface Rule {
    totalTimeSeconds: number;
    negativeMarking: boolean;
    negativeMarkValue: number;
    partialMarking: boolean;
    adaptiveAllowed: boolean;
}

export interface Blueprint {
    id: string;
    examId: string;
    version: number;
    defaultDurationSeconds: number;
    effectiveFrom: string;
    effectiveTo: string | null;
    sections: Section[];
    rules: Rule[];
}

export interface SubscriptionPack {
    id: string;
    examId: string;
    name: string;
    durationDays: number;
    price: number;
    isActive: boolean;
    exam: { id: string; name: string };
    _count?: {
        subscriptions: number;
    };
}

export interface Subscription {
    id: string;
    userId: string;
    packId: string;
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    startedAt: string;
    expiresAt: string;
    pack: {
        exam: { id: string; name: string };
    };
}

export const examSetupService = {
    // Exams
    getExams: async (): Promise<Exam[]> => {
        const response = await apiClient.get<Exam[]>('/exams');
        return response.data;
    },

    getExam: async (id: string): Promise<Exam & { blueprints: Blueprint[] }> => {
        const response = await apiClient.get<Exam & { blueprints: Blueprint[] }>(`/exams/${id}`);
        return response.data;
    },

    getActiveBlueprint: async (examId: string): Promise<Blueprint | null> => {
        const response = await apiClient.get<Blueprint | null>(`/exams/${examId}/blueprints/active`);
        return response.data;
    },

    // Subscription Packs
    getPacks: async (): Promise<SubscriptionPack[]> => {
        const response = await apiClient.get<SubscriptionPack[]>('/subscriptions/packs');
        return response.data;
    },

    getPacksByExam: async (examId: string): Promise<SubscriptionPack[]> => {
        const response = await apiClient.get<SubscriptionPack[]>(`/subscriptions/packs/exam/${examId}`);
        return response.data;
    },

    // Subscriptions
    subscribe: async (data: { packId: string; paymentProvider?: string; providerReference?: string }): Promise<Subscription> => {
        const response = await apiClient.post<Subscription>('/subscriptions/subscribe', data);
        return response.data;
    },

    getMySubscriptions: async (): Promise<Subscription[]> => {
        const response = await apiClient.get<Subscription[]>('/subscriptions/my');
        return response.data;
    },

    cancelSubscription: async (id: string): Promise<Subscription> => {
        const response = await apiClient.delete<Subscription>(`/subscriptions/my/${id}/cancel`);
        return response.data;
    },

    checkAccess: async (examId: string): Promise<Subscription | null> => {
        const response = await apiClient.get<Subscription | null>(`/subscriptions/my/access/${examId}`);
        return response.data;
    },
};
