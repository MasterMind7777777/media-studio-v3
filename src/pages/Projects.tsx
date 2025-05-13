
import { useRenderJobs } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { RefreshCcw, AlertCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { ProjectCard } from "@/components/ProjectCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Projects() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get('job');
  
  const { data: renderJobs, isLoading, error } = useRenderJobs();
  
  // Show notification if redirected from creation with job ID
  useEffect(() => {
    if (jobIdParam) {
      toast.success('Render job created', {
        description: 'Your render has been submitted and will be processed shortly.',
      });
    }
  }, [jobIdParam]);
  
  // Handle "Create New" button click
  const handleCreateNew = () => {
    navigate('/create');
  };
  
  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">
            View and manage your media projects
          </p>
        </div>
        <Button onClick={handleCreateNew}>Create New</Button>
      </div>
      
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col">
              <Skeleton className="w-full h-48 rounded-t-lg" />
              <Skeleton className="w-2/3 h-6 mt-4" />
              <Skeleton className="w-1/2 h-4 mt-2" />
              <Skeleton className="w-full h-6 mt-4" />
            </div>
          ))}
        </div>
      )}
      
      {error && (
        <div className="border border-red-200 bg-red-50 rounded-md p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">Error loading render jobs: {error.message}</p>
        </div>
      )}
      
      {!isLoading && !error && renderJobs?.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
          <p className="mb-4">No projects yet. Start by creating a new project.</p>
          <Button onClick={handleCreateNew}>Create Your First Project</Button>
        </div>
      )}
      
      {renderJobs && renderJobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
          {renderJobs.map((job) => (
            <ProjectCard key={job.id} project={job} />
          ))}
        </div>
      )}
    </div>
  );
}
