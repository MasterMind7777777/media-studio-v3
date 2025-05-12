
import { Header } from "@/components/Layout/Header";
import { SideNavigation } from "@/components/Layout/SideNavigation";
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  
  // Ensure user is redirected to appropriate page
  useEffect(() => {
    if (user && location.pathname === '/') {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, user]);

  return (
    <div className="min-h-screen flex w-full">
      <aside className="hidden md:flex w-64 flex-col border-r bg-background">
        <SideNavigation />
      </aside>
      <div className="flex flex-col flex-1 min-w-0">
        <Header isAdminMode={false} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
