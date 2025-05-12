
import { Header } from "@/components/Layout/Header";
import { SideNavigation } from "@/components/Layout/SideNavigation";
import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAdmin } = useAuth();
  
  return (
    <div className="min-h-screen flex w-full">
      <aside className="hidden md:flex w-64 flex-col border-r bg-background">
        <SideNavigation />
      </aside>
      <div className="flex flex-col flex-1 min-w-0">
        <Header isAdminMode={isAdmin} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
