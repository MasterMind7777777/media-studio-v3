
import { cn } from "@/lib/utils";
import { SideNavItem } from "@/types";
import { Home, Settings, FolderOpen, Layers, Activity, PlusCircle, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface SideNavigationProps {
  items?: SideNavItem[];
  className?: string;
}

const defaultItems: SideNavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "My Projects",
    href: "/projects",
    icon: FolderOpen,
  },
  {
    title: "Templates",
    href: "/templates",
    icon: Layers,
  },
  {
    title: "Activity",
    href: "/activity",
    icon: Activity,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function SideNavigation({ items = defaultItems, className }: SideNavigationProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const handleCreateNew = () => {
    navigate('/create');
  };

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-semibold tracking-tight text-studio-700">
              Media Studio
            </h2>
          </div>
          <div className="space-y-1">
            <button
              onClick={handleCreateNew}
              className="w-full flex items-center justify-center gap-2 bg-studio-600 text-white px-4 py-2 rounded-md hover:bg-studio-700 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Create New
            </button>
          </div>
        </div>
        <div className="px-3">
          <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
            Navigation
          </h2>
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

            {/* Admin section, only shown to admin users */}
            {isAdmin && (
              <>
                <div className="my-4 border-t border-muted pt-4">
                  <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
                    Administration
                  </h2>
                </div>
                <button
                  onClick={() => navigate('/admin')}
                  className={cn(
                    "w-full flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
                    location.pathname.startsWith('/admin') && "bg-accent text-accent-foreground"
                  )}
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin Panel</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
