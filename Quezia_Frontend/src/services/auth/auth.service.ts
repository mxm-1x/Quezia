import { apiClient } from '../api';

// --- Types ---

export const UserRole = {
    LEARNER: 'LEARNER',
    ADMIN: 'ADMIN',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const PreparationStage = {
    BEGINNER: 'BEGINNER',
    INTERMEDIATE: 'INTERMEDIATE',
    ADVANCED: 'ADVANCED',
} as const;
export type PreparationStage = typeof PreparationStage[keyof typeof PreparationStage];

export const Difficulty = {
    EASY: 'EASY',
    MEDIUM: 'MEDIUM',
    HARD: 'HARD',
    MIXED: 'MIXED',
} as const;
export type Difficulty = typeof Difficulty[keyof typeof Difficulty];

export interface UserProfile {
    fullName: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    country: string | null;
    timezone: string | null;
    targetExamId: string | null;
    targetExamYear: number | null;
    preparationStage: PreparationStage | null;
    studyGoal: string | null;
    preferredSubjects: string[];
    preferredDifficultyBias: Difficulty | null;
    dailyStudyTimeTargetMinutes: number | null;
    notificationPreferences: Record<string, boolean>;
    preferredLanguage: string | null;
    onboardingCompleted: boolean;
    onboardingStep: number | null;
    initialDiagnosticTestId: string | null;
}

export interface User {
    id: string;
    email: string;
    username: string;
    role: UserRole;
    isActive: boolean;
    isEmailVerified: boolean;
    lastLogin: string | null;
    createdAt: string;
    profile?: UserProfile;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface RegisterDto {
    username: string;
    email: string;
    password: string;
}

export interface LoginDto {
    email?: string;
    username?: string;
    password: string;
}

export type UpdateProfileDto = Partial<UserProfile>;

// --- Service ---

export const authService = {
    register: async (data: RegisterDto): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    login: async (data: LoginDto): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/login', data);
        return response.data;
    },

    refresh: async (refreshToken: string): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
        return response.data;
    },

    logout: async (refreshToken: string): Promise<void> => {
        await apiClient.post('/auth/logout', { refreshToken });
    },

    forgotPassword: async (email: string): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>('/auth/reset-password', { token, newPassword });
        return response.data;
    },

    getMe: async (): Promise<User> => {
        const response = await apiClient.get<User>('/users/me');
        return response.data;
    },

    updateProfile: async (data: UpdateProfileDto): Promise<User> => {
        const response = await apiClient.patch<User>('/users/me/profile', data);
        return response.data;
    },

    updateContext: async (data: { targetExamId?: string; targetExamYear?: number }): Promise<User> => {
        const response = await apiClient.patch<User>('/users/me/context', data);
        return response.data;
    },
};
