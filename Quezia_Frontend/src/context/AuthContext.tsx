import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService, type User, type LoginDto, type RegisterDto, type AuthResponse } from '../services/auth/auth.service';
import { AuthContext } from './AuthContextDefinition';

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY = 'auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const setAuthData = useCallback((data: AuthResponse, rememberMe: boolean) => {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(TOKEN_KEY, data.accessToken);
        storage.setItem(REFRESH_KEY, data.refreshToken);
        storage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
    }, []);

    const clearAuthData = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(USER_KEY);
        sessionStorage.clear();
        setUser(null);
    }, []);

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            const storedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
            const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

            if (storedUser && token) {
                try {
                    setUser(JSON.parse(storedUser));
                    // Optionally verify token with /users/me
                    const freshUser = await authService.getMe();
                    setUser(freshUser);
                    const storage = localStorage.getItem(USER_KEY) ? localStorage : sessionStorage;
                    storage.setItem(USER_KEY, JSON.stringify(freshUser));
                } catch (error) {
                    // Failed to restore session
                    clearAuthData();
                }
            }
            setLoading(false);
        };

        initAuth();
    }, [clearAuthData]);

    const login = async (data: LoginDto, rememberMe: boolean) => {
        const response = await authService.login(data);
        setAuthData(response, rememberMe);

        // Proactively fetch full profile to ensure onboarding state is accurate
        try {
            const fullUser = await authService.getMe();
            updateUser(fullUser);
        } catch (e) {
            // Profile fetch failed - continue
        }
    };

    const register = async (data: RegisterDto, rememberMe: boolean) => {
        const response = await authService.register(data);
        setAuthData(response, rememberMe);

        // Proactively fetch full profile
        try {
            const fullUser = await authService.getMe();
            updateUser(fullUser);
        } catch (e) {
            // Profile fetch failed - continue
        }
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY);
        if (refreshToken) {
            try {
                await authService.logout(refreshToken);
            } catch (error) {
                // Logout failed on backend - continue with local logout
            }
        }
        clearAuthData();
    };

    const updateUser = (newUser: User) => {
        setUser(newUser);
        const storage = localStorage.getItem(USER_KEY) ? localStorage : sessionStorage;
        storage.setItem(USER_KEY, JSON.stringify(newUser));
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            loading,
            login,
            register,
            logout,
            updateUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};
