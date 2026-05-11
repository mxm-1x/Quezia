import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED !== 'false';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Bypass auth in development when VITE_AUTH_ENABLED=false
  if (!AUTH_ENABLED) {
    return <>{children}</>;
  }

  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  // Check for onboarding
  const onboardingCompleted = user?.profile?.onboardingCompleted;
  if (!onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;