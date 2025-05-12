
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Maximize, Pause } from "lucide-react";
import { useCreatomatePreview } from "@/hooks/templates";

interface TemplatePreviewProps {
  previewImageUrl: string;
  width?: number;
  height?: number;
  templateId?: string;
  variables?: Record<string, any>;
}

export function TemplatePreview({ previewImageUrl, width, height, templateId, variables }: TemplatePreviewProps) {
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const {
    isLoaded,
    isPlaying,
    error,
    toggle: togglePlayback
  } = useCreatomatePreview({
    templateId,
    variables,
    containerRef: previewContainerRef,
    autoPlay: false,
    loop: true,
    muted: true
  });
  
  const handleFullscreen = () => {
    if (previewContainerRef.current) {
      if (!document.fullscreenElement) {
        previewContainerRef.current.requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch((err) => console.error(`Error attempting to enable fullscreen: ${err.message}`));
      } else {
        document.exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch((err) => console.error(`Error attempting to exit fullscreen: ${err.message}`));
      }
    }
  };

  return (
    <Card className="h-full">
      <div 
        ref={previewContainerRef} 
        className="aspect-video bg-black/80 rounded-t-md flex items-center justify-center relative"
        style={{ minHeight: '240px' }}
      >
        {!isLoaded && !error && (
          <div className="text-white text-center p-8 absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-xl font-medium mb-4">Loading Preview</div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <img 
              src={previewImageUrl} 
              alt="Preview" 
              className="max-w-full max-h-60 mx-auto rounded-md shadow-lg opacity-40 mt-4"
            />
          </div>
        )}
        
        {error && (
          <div className="text-white text-center p-8 absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-xl font-medium mb-4">Preview Error</div>
            <p className="text-white/70 mb-4">{error}</p>
            <img 
              src={previewImageUrl} 
              alt="Preview" 
              className="max-w-full max-h-60 mx-auto rounded-md shadow-lg"
            />
          </div>
        )}
      </div>
      
      <div className="p-4 flex items-center justify-between border-t">
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={togglePlayback}
            disabled={!isLoaded || !!error}
          >
            {isPlaying ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleFullscreen}
            disabled={!isLoaded || !!error}
          >
            <Maximize className="h-4 w-4 mr-1" />
            Fullscreen
          </Button>
        </div>
        <div className="text-muted-foreground text-sm">
          {width} × {height}
        </div>
      </div>
    </Card>
  );
}
