
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RenderJob } from "@/types";
import { Eye, AlertCircle } from "lucide-react";
import { useState } from "react";

interface ProjectCardProps {
  project: RenderJob;
  onClick?: () => void;
}

export const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "succeeded":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "processing":
      case "rendering":
      case "planned":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "failed":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      default:
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
    }
  };
  
  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case "succeeded":
        return "Completed";
      case "planned":
        return "Planned";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Get project name or fallback to ID
  const getProjectName = () => {
    if (project.name) return project.name;
    return `Project ${project.id.substring(0, 8)}`;
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
    <Card 
      className="overflow-hidden cursor-pointer hover:border-primary/50 transition-all"
      onClick={onClick}
    >
      {/* Image section */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {project.snapshot_url && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            )}
            <img
              src={project.snapshot_url}
              alt={getProjectName()}
              className={`h-full w-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
            {project.status === "processing" ? (
              <div className="animate-pulse text-sm">Processing...</div>
            ) : (
              <div className="text-sm">No Preview Available</div>
            )}
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="truncate">{getProjectName()}</CardTitle>
            <CardDescription>
              Created {formatDate(project.created_at)}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(project.status)}>
            {formatStatus(project.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {project.status === "failed" && (
          <div className="text-red-500 text-xs flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            Rendering failed. Please try again.
          </div>
        )}
        {project.output_urls && Object.keys(project.output_urls).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(project.output_urls).map(([id, url], index) => (
              <a 
                key={id} 
                href={url} 
                target="_blank" 
                rel="noreferrer" 
                className="text-xs text-primary hover:text-primary/80 flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye className="h-3 w-3 mr-1" />
                View Output {Object.keys(project.output_urls).length > 1 ? index + 1 : ""}
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
