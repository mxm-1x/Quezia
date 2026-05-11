import React, { useState, useEffect, useCallback, useContext } from 'react';
import { testEngineService, type TestThread, type Attempt } from '../services/test-engine/test-engine.service';
import { TestContext } from './TestContextDefinition';
import { AuthContext } from './AuthContextDefinition';

export const TestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const auth = useContext(AuthContext);
    const [threads, setThreads] = useState<TestThread[]>([]);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshThreads = useCallback(async () => {
        try {
            const fetchedThreads = await testEngineService.getThreads();
            setThreads(fetchedThreads);
        } catch (error) {
            // Failed to fetch threads - handle silently
        }
    }, []);

    const refreshAttempts = useCallback(async (threadId?: string) => {
        try {
            const fetchedAttempts = await testEngineService.getAttempts(threadId);
            setAttempts(fetchedAttempts);
        } catch (error) {
            // Failed to fetch attempts - handle silently
        }
    }, []);

    const loadInitialData = useCallback(async () => {
        setIsLoading(true);
        await Promise.all([refreshThreads(), refreshAttempts()]);
        setIsLoading(false);
    }, [refreshThreads, refreshAttempts]);

    useEffect(() => {
        // Wait for auth to finish initializing before making any API calls
        if (!auth || auth.loading) return;

        // If not authenticated, clear test data and stop loading
        if (!auth.isAuthenticated) {
            setThreads([]);
            setAttempts([]);
            setIsLoading(false);
            return;
        }

        // Auth is ready and user is authenticated — safe to fetch
        loadInitialData();
    }, [auth?.loading, auth?.isAuthenticated, loadInitialData]);

    return (
        <TestContext.Provider value={{ threads, attempts, isLoading, refreshThreads, refreshAttempts }}>
            {children}
        </TestContext.Provider>
    );
};
