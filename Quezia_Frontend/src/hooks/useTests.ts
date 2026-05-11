import { useContext } from 'react';
import { TestContext } from '../context/TestContextDefinition';

export const useTests = () => {
    const context = useContext(TestContext);
    if (context === undefined) {
        throw new Error('useTests must be used within a TestProvider');
    }
    return context;
};
