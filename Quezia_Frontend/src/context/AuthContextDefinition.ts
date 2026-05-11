import { createContext } from 'react';
import { type User, type LoginDto, type RegisterDto } from '../services/auth/auth.service';

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (data: LoginDto, rememberMe: boolean) => Promise<void>;
    register: (data: RegisterDto, rememberMe: boolean) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
