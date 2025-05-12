
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { MainLayout } from './Layout/MainLayout';

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    // Save the location they were trying to access for redirecting after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // If URL is exactly "/", redirect to dashboard
  if (location.pathname === "/") {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Render child routes if authenticated
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};
