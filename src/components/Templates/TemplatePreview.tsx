import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Maximize, Pause, AlertCircle, RotateCcw } from "lucide-react";
import { useCreatomatePreview } from "@/hooks/templates";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { DEFAULT_TEMPLATE_ID } from "@/config/creatomate";
import { getCreatomateToken } from "@/integrations/creatomate/config";
import { CREATOMATE_PUBLIC_TOKEN } from "@/config/creatomate";

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
  const [browserInfo, setBrowserInfo] = useState<string | null>(null);
  const [apiToken, setApiToken] = useState<string>(CREATOMATE_PUBLIC_TOKEN);
  const [templateId, setTemplateId] = useState<string>(creatomateTemplateId);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get the token from config
  useEffect(() => {
    async function fetchCredentials() {
      try {
        // Try to get token from config or function
        if (!apiToken) {
          const token = await getCreatomateToken();
          setApiToken(token);
        }
        
        // Use the template ID from props
        if (creatomateTemplateId) {
          setTemplateId(creatomateTemplateId);
        }
      } catch (err) {
        console.error('Failed to fetch Creatomate credentials:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchCredentials();
  }, [apiToken, creatomateTemplateId]);
  
  // Check browser compatibility
  useEffect(() => {
    const checkBrowser = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      let browserName = "unknown";
      let browserVersion = "unknown";
      
      if (userAgent.indexOf("chrome") > -1) {
        browserName = "chrome";
        const match = userAgent.match(/chrome\/(\d+)/);
        if (match) browserVersion = match[1];
      } else if (userAgent.indexOf("firefox") > -1) {
        browserName = "firefox";
        const match = userAgent.match(/firefox\/(\d+)/);
        if (match) browserVersion = match[1];
      } else if (userAgent.indexOf("safari") > -1) {
        browserName = "safari";
        const match = userAgent.match(/version\/(\d+)/);
        if (match) browserVersion = match[1];
      } else if (userAgent.indexOf("edg") > -1) {
        browserName = "edge";
        const match = userAgent.match(/edg\/(\d+)/);
        if (match) browserVersion = match[1];
      }
      
      setBrowserInfo(`${browserName} ${browserVersion}`);
    };
    
    checkBrowser();
  }, []);
  
  // Only proceed with preview initialization after we've attempted to load credentials
  const {
    isLoaded: isPreviewLoaded,
    isPlaying,
    error,
    toggle: togglePlayback,
    previewMode,
    retryInitialization
  } = useCreatomatePreview({
    creatomateTemplateId: templateId,
    creatomateToken: apiToken,
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
        {!isPreviewLoaded && !error && (
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
            <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
            <div className="text-xl font-medium mb-2">Preview Error</div>
            <p className="text-white/70 mb-4">{error}</p>
            {!templateId && (
              <Alert variant="destructive" className="mb-4 max-w-md">
                <AlertTitle>Missing Template ID</AlertTitle>
                <AlertDescription>
                  Check that a valid Creatomate template ID was provided
                </AlertDescription>
              </Alert>
            )}
            
            {/* Browser information */}
            {browserInfo && (
              <div className="text-xs text-white/70 mb-2">
                Browser: {browserInfo}
              </div>
            )}
            
            <Button 
              size="sm" 
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white mb-4"
              onClick={retryInitialization}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Retry
            </Button>
            
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
            disabled={!isPreviewLoaded || !!error}
          >
            {isPlaying ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleFullscreen}
            disabled={!isPreviewLoaded || !!error}
          >
            <Maximize className="h-4 w-4 mr-1" />
            Fullscreen
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {previewMode && (
            <span className={`px-2 py-1 text-xs rounded-full ${
              previewMode === 'interactive' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'
            }`}>
              {previewMode === 'interactive' ? 'Interactive' : 'Player'} Mode
            </span>
          )}
          <div className="text-muted-foreground text-sm">
            {width} × {height}
          </div>
        </div>
      </div>
    </Card>
  );
}
