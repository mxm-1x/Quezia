import { useState, useCallback } from 'react';
import { useAuthContext } from './useAuthContext';
import { AxiosError } from 'axios';
import { type RegisterDto, type LoginDto, type User } from '../services/auth/auth.service';

interface ErrorResponse {
  message?: string;
}

interface UseAuthReturn {
  loading: boolean;
  error: string | null;
  login: (identifier: string, password: string, rememberMe: boolean) => Promise<void>;
  register: (username: string, email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  user: User | null;
  isAuthenticated: boolean;
  updateUser: (user: User) => void;
}

export const useAuth = (): UseAuthReturn => {
  const {
    login: contextLogin,
    register: contextRegister,
    logout: contextLogout,
    user,
    isAuthenticated,
    loading: contextLoading,
    updateUser: contextUpdateUser
  } = useAuthContext();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: AxiosError<ErrorResponse>) => {
    let message = 'An unexpected error occurred';

    if (err.response?.data?.message) {
      if (Array.isArray(err.response.data.message)) {
        message = err.response.data.message[0];
      } else {
        message = err.response.data.message;
      }
    } else if (err.message) {
      message = err.message;
    }

    setError(message);
    setLoading(false);
  }, []);

  const login = useCallback(async (
    identifier: string,
    password: string,
    rememberMe: boolean
  ) => {
    setLoading(true);
    setError(null);

    try {
      const isEmail = identifier.includes('@');
      const loginData: LoginDto = isEmail
        ? { email: identifier, password }
        : { username: identifier, password };

      await contextLogin(loginData, rememberMe);
    } catch (err) {
      handleError(err as AxiosError<ErrorResponse>);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contextLogin, handleError]);

  const register = useCallback(async (
    username: string,
    email: string,
    password: string,
    rememberMe: boolean
  ) => {
    setLoading(true);
    setError(null);

    try {
      const registerData: RegisterDto = {
        username,
        email,
        password,
      };

      await contextRegister(registerData, rememberMe);
    } catch (err) {
      handleError(err as AxiosError<ErrorResponse>);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contextRegister, handleError]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await contextLogout();
    } catch (err) {
      handleError(err as AxiosError<ErrorResponse>);
    } finally {
      setLoading(false);
    }
  }, [contextLogout, handleError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading: loading || contextLoading,
    error,
    login,
    register,
    logout,
    clearError,
    user,
    isAuthenticated,
    updateUser: contextUpdateUser,
  };
};