import { createContext } from 'react';
import { type TestThread, type Attempt } from '../services/test-engine/test-engine.service';

export interface TestContextType {
    threads: TestThread[];
    attempts: Attempt[];
    isLoading: boolean;
    refreshThreads: () => Promise<void>;
    refreshAttempts: (threadId?: string) => Promise<void>;
}

export const TestContext = createContext<TestContextType | undefined>(undefined);
