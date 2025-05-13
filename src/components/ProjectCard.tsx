
import React from 'react';
import { RenderJob } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Eye, AlertCircle } from 'lucide-react';
import { getTemplatePreviewImage } from '@/hooks/templates/useTemplatePreview';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Helper function for formatting dates
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return format(date, 'MMM d, yyyy h:mm a');
};

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

interface ProjectCardProps {
  job: RenderJob;
  template?: {
    id: string;
    preview_image_url?: string;
    variables?: Record<string, any>;
  } | null;
  isLoading?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ job, template, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg">
        <div className="w-full h-48 bg-gray-200 animate-pulse rounded-t-lg"></div>
        <CardContent className="p-4">
          <div className="h-4 bg-gray-200 animate-pulse rounded mb-2 w-2/3"></div>
          <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2"></div>
        </CardContent>
      </Card>
    );
  }

  // Use snapshot_url if available, otherwise fall back to template preview image
  const imageUrl = job.snapshot_url || (template ? getTemplatePreviewImage(template) : '/placeholder.svg');

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

  return (
    <Card className="overflow-hidden relative transition-all duration-200 hover:shadow-lg hover:scale-[1.01]">
      <div className="relative">
        <div className="w-full h-48 bg-gray-100">
          <img
            src={imageUrl}
            alt={job.name || `Project ${job.id.substring(0, 8)}`}
            className="w-full h-48 object-cover rounded-t-lg"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>
        <div className="absolute top-2 right-2">
          <Badge className={cn("font-medium", getStatusColor(job.status))}>
            {formatStatus(job.status)}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold truncate text-lg">
          {job.name || `Project ${job.id.substring(0, 8)}`}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Created {formatDate(job.created_at)}
        </p>
        
        <div>
          {renderOutputUrls(job.output_urls)}
        </div>
        
        {job.status === 'failed' && (
          <div className="text-red-500 text-xs mt-2 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            Rendering failed. Please try again.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
