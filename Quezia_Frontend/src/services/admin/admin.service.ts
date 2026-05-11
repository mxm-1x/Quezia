import { apiClient } from '../api';

export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    resource: string;
    resourceId: string | null;
    metadata: any;
    createdAt: string;
}

export interface SystemAnalytics {
    users: { total: number; active: number; inactive: number };
    exams: { total: number };
    tests: { total: number; published: number; draft: number };
    attempts: { total: number; completed: number; active: number };
}

export const adminService = {
    // User Management
    suspendUser: async (id: string): Promise<{ message: string }> => {
        const response = await apiClient.patch<{ message: string }>(`/users/${id}/suspend`);
        return response.data;
    },

    activateUser: async (id: string): Promise<{ message: string }> => {
        const response = await apiClient.patch<{ message: string }>(`/users/${id}/activate`);
        return response.data;
    },

    // Question Management
    createQuestion: async (data: any): Promise<any> => {
        const response = await apiClient.post('/questions', data);
        return response.data;
    },

    deleteQuestion: async (id: string): Promise<{ message: string }> => {
        const response = await apiClient.delete(`/questions/${id}`);
        return response.data;
    },

    // Subscription Pack Management
    createPack: async (data: any): Promise<any> => {
        const response = await apiClient.post('/subscriptions/packs', data);
        return response.data;
    },

    grantSubscription: async (data: { userId: string; packId: string; durationDaysOverride?: number }): Promise<any> => {
        const response = await apiClient.post('/subscriptions/admin/grant', data);
        return response.data;
    },

    // System Analytics
    getSystemAnalytics: async (): Promise<SystemAnalytics> => {
        const response = await apiClient.get<SystemAnalytics>('/admin/analytics/system');
        return response.data;
    },
};
