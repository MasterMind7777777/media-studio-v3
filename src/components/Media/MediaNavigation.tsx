
import { cn } from "@/lib/utils";
import { 
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import { Image, Clock, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MediaNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  mediaCount?: number;
  recentUploadsCount?: number;
}

export function MediaNavigation({ 
  activeTab, 
  onTabChange, 
  mediaCount = 0,
  recentUploadsCount = 0
}: MediaNavigationProps) {
  const navigationItems = [
    {
      id: "all-uploads",
      label: "All Uploads",
      icon: Image,
      count: mediaCount
    },
    {
      id: "recent-uploads",
      label: "Recent Uploads",
      icon: Clock,
      count: recentUploadsCount
    },
    {
      id: "content-packs",
      label: "Content Packs",
      icon: FolderOpen,
      count: null
    }
  ];

  return (
    <div className="bg-background border rounded-lg p-4 space-y-1">
      <h3 className="font-medium px-4 py-2 text-sm">Media Library</h3>
      <NavigationMenu orientation="vertical" className="w-full max-w-none">
        <NavigationMenuList className="flex-col items-start space-y-1">
          {navigationItems.map((item) => (
            <NavigationMenuItem key={item.id} className="w-full">
              <NavigationMenuLink
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-4 py-2 rounded-md text-sm",
                  activeTab === item.id 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => onTabChange(item.id)}
              >
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
                {item.count !== null && (
                  <Badge variant="outline" className="ml-auto">
                    {item.count}
                  </Badge>
                )}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
