
import { RecentRenders } from "@/components/Dashboard/RecentRenders";
import { FeaturedTemplates } from "@/components/Dashboard/FeaturedTemplates";
import { StatsCards } from "@/components/Dashboard/StatsCards";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground">
          Create, customize and render your media projects
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <Button 
          className="flex items-center gap-2 bg-studio-600 hover:bg-studio-700 shadow-md"
          size="lg"
          onClick={() => navigate("/create")}
        >
          <PlusCircle className="h-4 w-4" />
          Create New Project
        </Button>
      </div>

      <StatsCards />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentRenders />
        <div className="space-y-6">
          <FeaturedTemplates />
        </div>
      </div>
    </div>
  );
}
