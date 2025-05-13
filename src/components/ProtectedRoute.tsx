
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { MainLayout } from './Layout/MainLayout';
import { memo } from 'react';

// Using memo to prevent unnecessary re-renders of the loading state
const LoadingIndicator = memo(() => (
  <div className="flex h-screen items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
));

LoadingIndicator.displayName = 'LoadingIndicator';

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Show loading state while checking authentication
  if (loading) {
    return <LoadingIndicator />;
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    // Save the location they were trying to access for redirecting after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Render child routes inside the MainLayout if authenticated
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};
