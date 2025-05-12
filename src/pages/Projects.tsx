
import { useRenderJobs } from "@/hooks/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, RefreshCcw, AlertCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "@/components/ui/sonner";

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
  
  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'succeeded':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'processing':
      case 'rendering':
      case 'planned':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
    }
  };
  
  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'Completed';
      case 'planned':
        return 'Planned';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  // Handle "Create New" button click
  const handleCreateNew = () => {
    navigate('/create');
  };
  
  // Function to render output URLs
  const renderOutputUrls = (outputUrls: Record<string, string>) => {
    if (!outputUrls || Object.keys(outputUrls).length === 0) {
      return <p className="text-muted-foreground text-sm">No outputs available yet</p>;
    }
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {Object.entries(outputUrls).map(([id, url], index) => (
          <a 
            key={id} 
            href={url} 
            target="_blank" 
            rel="noreferrer" 
            className="text-sm text-blue-500 hover:text-blue-700 flex items-center"
          >
            <Eye className="h-3 w-3 mr-1" />
            View Output {Object.keys(outputUrls).length > 1 ? index + 1 : ''}
          </a>
        ))}
      </div>
    );
  };
  
  // Format date to readable string
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
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
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-studio-600"></div>
        </div>
      )}
      
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">Error loading render jobs: {error.message}</p>
          </CardContent>
        </Card>
      )}
      
      {!isLoading && !error && renderJobs?.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
          <p className="mb-4">No projects yet. Start by creating a new project.</p>
          <Button onClick={handleCreateNew}>Create Your First Project</Button>
        </div>
      )}
      
      {renderJobs && renderJobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderJobs.map((job) => (
            <Card key={job.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="truncate">Render {job.id.substring(0, 8)}</CardTitle>
                    <CardDescription>
                      Created {formatDate(job.created_at)}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(job.status)}>
                    {formatStatus(job.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Outputs</h4>
                    {renderOutputUrls(job.output_urls)}
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {job.platforms.map((platform, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {platform.name || `${platform.width}×${platform.height}`}
                      </Badge>
                    ))}
                  </div>
                  
                  {job.status === 'failed' && (
                    <div className="text-red-500 text-xs mt-2">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      Rendering failed. Please try again.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
