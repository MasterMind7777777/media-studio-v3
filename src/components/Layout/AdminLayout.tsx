
import { Header } from "@/components/Layout/Header";
import { AdminSideNavigation } from "@/components/Layout/AdminSideNavigation";
import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, isAdmin } = useAuth();
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex w-full">
      <aside className="hidden md:flex w-64 flex-col border-r bg-background">
        <AdminSideNavigation />
      </aside>
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <div className="p-4 border-b bg-amber-50">
          <div className="text-amber-800 font-medium text-sm flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-500 mr-2"></span>
            Admin Mode
          </div>
        </div>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
