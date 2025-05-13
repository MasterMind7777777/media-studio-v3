
import { useInfiniteRenderJobs } from "@/hooks/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCcw, AlertCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { ProjectCard } from "@/components/Projects/ProjectCard";
import { getProjectName } from "@/utils/getProjectName";

export default function Projects() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get('job');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useInfiniteRenderJobs();
  
  // Show notification if redirected from creation with job ID
  useEffect(() => {
    if (jobIdParam) {
      toast.success('Render job created', {
        description: 'Your render has been submitted and will be processed shortly.',
      });
    }
  }, [jobIdParam]);

  // Setup intersection observer for infinite scroll
  const setupObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          console.log("Load more element is visible, fetching next page");
          fetchNextPage();
        }
      },
      { rootMargin: "100px" }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Update observer when relevant dependencies change
  useEffect(() => {
    setupObserver();
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [setupObserver]);
  
  // Handle "Create New" button click
  const handleCreateNew = () => {
    navigate('/create');
  };

  // Handle project click to navigate to customize page
  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}/customize`);
  };
  
  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(6)
      .fill(0)
      .map((_, index) => (
        <div key={`skeleton-${index}`} className="flex flex-col gap-2">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ));
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
        <div className="flex gap-2">
          {error && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => refetch()}
              title="Refresh"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          )}
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" /> Create New
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="border border-red-200 bg-red-50 p-4 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">Error loading projects: {error.message}</p>
        </div>
      )}
      
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {renderSkeletons()}
        </div>
      )}
      
      {!isLoading && data?.pages && data.pages[0].data.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
          <p className="mb-4">No projects yet. Start by creating a new project.</p>
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" /> Create Your First Project
          </Button>
        </div>
      )}
      
      {data?.pages && data.pages[0].data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.pages.flatMap(page => 
            page.data.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onClick={() => handleProjectClick(project.id)}
              />
            ))
          )}
          
          {/* Loading indicator for infinite scroll */}
          {(isFetchingNextPage || hasNextPage) && (
            <div ref={loadMoreRef} className="col-span-full flex justify-center p-4">
              {isFetchingNextPage && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
