
import { Header } from "@/components/Layout/Header";
import { AdminSideNavigation } from "@/components/Layout/AdminSideNavigation";
import { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen flex w-full">
      <aside className="hidden md:flex w-64 flex-col border-r bg-background">
        <AdminSideNavigation />
      </aside>
      <div className="flex flex-col flex-1 min-w-0">
        <Header isAdminMode={true} />
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
