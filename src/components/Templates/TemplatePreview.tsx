
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Maximize, Pause, AlertCircle, RotateCcw, ImageIcon } from "lucide-react";
import { useCreatomatePreview } from "@/hooks/templates";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { DEFAULT_TEMPLATE_ID } from "@/config/creatomate";
import { getCreatomateToken } from "@/integrations/creatomate/config";
import { CREATOMATE_PUBLIC_TOKEN } from "@/config/creatomate";
import { isImageUrl } from "@/lib/utils";

interface TemplatePreviewProps {
  previewImageUrl: string;
  width?: number;
  height?: number;
  templateId?: string;
  creatomateTemplateId?: string;
  variables?: Record<string, any>;
}

export function TemplatePreview({ 
  previewImageUrl, 
  width, 
  height, 
  creatomateTemplateId = DEFAULT_TEMPLATE_ID, 
  variables 
}: TemplatePreviewProps) {
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const [imgError, setImgError] = useState(false);
  const previewContainerId = "creatomate-preview-container";
  
  // Reset image error state when previewImageUrl changes
  useEffect(() => {
    setImgError(false);
  }, [previewImageUrl]);
  
  // Check if preview URL is valid
  const hasValidPreviewImage = previewImageUrl && 
                              previewImageUrl !== '/placeholder.svg' && 
                              isImageUrl(previewImageUrl) &&
                              !imgError;
                              
  // Detect if SDK is disabled
  useEffect(() => {
    const isDisabled = sessionStorage.getItem('creatomate-sdk-disabled') === 'true';
    setIsDisabled(isDisabled);
  }, []);

  return (
    <Card className="h-full">
      <div 
        id={previewContainerId}
        ref={previewContainerRef} 
        className="aspect-video bg-black/80 rounded-t-md flex items-center justify-center relative"
        style={{ minHeight: '240px' }}
      >
        {isDisabled ? (
          <div className="text-white text-center p-8 absolute inset-0 flex flex-col items-center justify-center bg-muted/90">
            <div className="text-xl font-medium mb-2">Preview Disabled</div>
            <p className="text-muted-foreground mb-4">Creatomate SDK temporarily disabled for development</p>
            
            {hasValidPreviewImage ? (
              <div className="w-3/4 relative rounded-md overflow-hidden border border-border shadow-lg">
                <img 
                  src={previewImageUrl} 
                  alt="Template Preview" 
                  className="w-full h-auto object-cover"
                  onError={() => setImgError(true)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-background/80 text-xs py-1 px-2 text-center">
                  Static preview image
                </div>
              </div>
            ) : (
              <div className="w-3/4 aspect-video bg-background/40 rounded flex items-center justify-center">
                <ImageIcon className="h-12 w-12 opacity-30" />
              </div>
            )}
          </div>
        ) : (
          <div className="text-white text-center p-8 absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>
      
      <div className="p-4 flex items-center justify-between border-t">
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            disabled={isDisabled}
          >
            <Play className="h-4 w-4 mr-1" />
            Play
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            disabled={isDisabled}
          >
            <Maximize className="h-4 w-4 mr-1" />
            Fullscreen
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500`}>
            Preview Disabled
          </span>
          <div className="text-muted-foreground text-sm">
            {width} × {height}
          </div>
        </div>
      </div>
    </Card>
  );
}
