
import React from "react";
import { RenderJob } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { getTemplatePreviewImage } from "@/hooks/templates";
import { formatDate } from "@/lib/utils";

interface ProjectCardProps {
  project: RenderJob;
  onView?: (projectId: string) => void;
}

export function ProjectCard({ project, onView }: ProjectCardProps) {
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

  // Get display image - use snapshot_url if available, otherwise fallback to template preview
  const displayImage = project.snapshot_url || getTemplatePreviewImage({ id: project.template_id, variables: project.variables });

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-[1.01]">
      <div className="relative">
        <AspectRatio ratio={16/9} className="bg-muted">
          {displayImage ? (
            <img
              src={displayImage}
              alt={`Thumbnail for ${project.id}`}
              className="w-full h-full object-cover rounded-t-lg"
              loading="lazy"
            />
          ) : (
            <Skeleton className="w-full h-full rounded-t-lg" />
          )}
        </AspectRatio>
        <Badge 
          className={`absolute top-2 right-2 ${getStatusColor(project.status)}`}
        >
          {formatStatus(project.status)}
        </Badge>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-medium text-base mb-1 truncate">
          {project.name || `Render ${project.id.substring(0, 8)}`}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Created {formatDate(project.created_at)}
        </p>
        
        <div className="mt-2">
          {renderOutputUrls(project.output_urls)}
        </div>
      </CardContent>
    </Card>
  );
}
