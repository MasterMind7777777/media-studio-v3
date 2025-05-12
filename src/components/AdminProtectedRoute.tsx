
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { AdminLayout } from './Layout/AdminLayout';

export const AdminProtectedRoute = () => {
  const { user, loading, isAdmin } = useAuth();
  
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
    return <Navigate to="/auth" />;
  }
  
  // Redirect to home if authenticated but not admin
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  
  // Render admin layout with child routes if authenticated and admin
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};
