
import { cn } from "@/lib/utils";
import { SideNavItem } from "@/types";
import { LayoutDashboard, Users, Layers, Package, Settings, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AdminSideNavigationProps {
  items?: SideNavItem[];
  className?: string;
}

const defaultItems: SideNavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Templates",
    href: "/admin/templates",
    icon: Layers,
  },
  {
    title: "Content Packs",
    href: "/admin/content-packs",
    icon: Package,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSideNavigation({ items = defaultItems, className }: AdminSideNavigationProps) {
  const navigate = useNavigate();

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Admin Panel
              </h2>
              <p className="text-xs text-muted-foreground">
                Template Management System
              </p>
            </div>
          </div>
        </div>
        <div className="px-3">
          <div className="space-y-1">
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => item.href && navigate(item.href)}
                  className={cn(
                    "w-full flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
                    location.pathname === item.href && "bg-accent text-accent-foreground"
                  )}
                  disabled={item.disabled}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>
          
          {/* Return to main app button */}
          <div className="mt-6 pt-6 border-t">
            <Button 
              variant="secondary" 
              className="w-full flex items-center justify-center gap-2"
              onClick={() => navigate("/")}
            >
              <Home className="h-4 w-4" />
              <span>Return to Main App</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
