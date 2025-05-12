
import { Header } from "@/components/Layout/Header";
import { SideNavigation } from "@/components/Layout/SideNavigation";
import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAdmin } = useAuth();
  
  return (
    <div className="min-h-screen flex w-full">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background">
        <SideNavigation />
      </aside>
      
      {/* Mobile sidebar with sheet */}
      <div className="md:hidden fixed bottom-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="rounded-full shadow-lg">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SideNavigation />
          </SheetContent>
        </Sheet>
      </div>
      
      <div className="flex flex-col flex-1 min-w-0">
        <Header isAdminMode={isAdmin} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
