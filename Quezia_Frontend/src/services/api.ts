import axios from 'axios';

const API_URL = import.meta.env.VITE_CORE_URL || 'http://localhost:3000';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor for Token Refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Avoid infinite loops on auth endpoints
            const isAuthEndpoint = originalRequest.url?.includes('/auth/');
            if (isAuthEndpoint && !originalRequest.url?.includes('/auth/refresh')) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');

            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                    const { accessToken, refreshToken: newRefreshToken } = response.data;

                    const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage;
                    storage.setItem('access_token', accessToken);
                    storage.setItem('refresh_token', newRefreshToken);

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return apiClient(originalRequest);
                } catch (refreshError) {
                    // Refresh failed - logout user
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user_data');
                    sessionStorage.clear();
                    window.location.href = '/auth?mode=login';
                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);
