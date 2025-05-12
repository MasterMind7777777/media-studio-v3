
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Maximize, Pause, AlertCircle, RotateCcw, RefreshCw } from "lucide-react";
import { useCreatomatePreview } from "@/hooks/templates";
import { isCreatomateSDKAvailable, forcePageRefresh, loadCreatomateSDKManually } from "@/integrations/creatomate/config";

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
  creatomateTemplateId, 
  variables 
}: TemplatePreviewProps) {
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sdkStatus, setSdkStatus] = useState<string>("checking");
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const [loadingManually, setLoadingManually] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<string | null>(null);
  
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
  
  // Check if SDK is available but only once on component mount
  useEffect(() => {
    const checkSdk = () => {
      const available = isCreatomateSDKAvailable();
      setSdkStatus(available ? "loaded" : "not-loaded");
      
      // If SDK is not loaded, try loading manually
      if (!available) {
        console.log('SDK not detected on mount, trying to load manually...');
        setLoadingManually(true);
        loadCreatomateSDKManually()
          .then(() => {
            console.log('Manual SDK loading successful on mount');
            setSdkStatus("loaded");
            setLoadingManually(false);
          })
          .catch(() => {
            console.log('Manual SDK loading failed on mount');
            setLoadingManually(false);
          });
      }
    };
    
    // Initial check only, no interval to prevent refresh loops
    checkSdk();
    
    return () => {
      // No cleanup needed since we're not using intervals anymore
    };
  }, []);
  
  const {
    isLoaded,
    isPlaying,
    error,
    toggle: togglePlayback,
    getInitializationStatus,
    retryInitialization
  } = useCreatomatePreview({
    creatomateTemplateId,
    variables,
    containerRef: previewContainerRef,
    autoPlay: false,
    loop: true,
    muted: true,
    skipAutoRetry: true // New prop to prevent automatic retries
  });
  
  // For debugging purposes
  const initStatus = getInitializationStatus?.();
  
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
  
  // Retry initialization by using the hook's retry function - with rate limiting
  const handleRetryInitialization = () => {
    // Rate limit the retries
    setRefreshAttempts(prev => prev + 1);
    setSdkStatus("checking");
    setLoadingManually(true);
    
    if (retryInitialization) {
      retryInitialization();
      
      // Update SDK status after a delay
      setTimeout(() => {
        const available = isCreatomateSDKAvailable();
        setSdkStatus(available ? "loaded" : "not-loaded");
        setLoadingManually(false);
      }, 2000);
    }
  };
  
  // Force page refresh to reload SDK - but prevent multiple quick refreshes
  const handleForceRefresh = () => {
    // Only allow refresh every few seconds to prevent infinite loops
    forcePageRefresh();
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
            <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
            <div className="text-xl font-medium mb-2">Preview Error</div>
            <p className="text-white/70 mb-4">{error}</p>
            {!creatomateTemplateId && (
              <p className="text-white/70 mb-4">Missing Creatomate template ID</p>
            )}
            
            {/* SDK Status Indicator */}
            <div className={`text-xs px-2 py-1 rounded mb-3 ${
              sdkStatus === "loaded" ? "bg-green-500/30" : "bg-red-500/30"
            }`}>
              Creatomate SDK: {
                loadingManually ? "Loading..." : 
                sdkStatus === "loaded" ? "Detected ✓" : "Not Detected ✗"
              }
            </div>
            
            {/* Browser information */}
            {browserInfo && (
              <div className="text-xs text-white/70 mb-2">
                Browser: {browserInfo}
              </div>
            )}
            
            {/* Debugging information */}
            {initStatus && (
              <div className="text-xs text-white/70 mb-4 max-w-md p-3 bg-black/30 rounded">
                <h4 className="font-medium mb-1 text-white/90">Debug Information</h4>
                <div className="grid grid-cols-2 gap-x-4 text-left">
                  <p>SDK loaded: {initStatus.sdkLoaded ? '✅' : '❌'}</p>
                  <p>Creatomate SDK: {initStatus.hasCreatomateSDK ? '✅' : '❌'}</p>
                  <p>Container: {initStatus.hasContainer ? '✅' : '❌'}</p>
                  <p>Template ID: {initStatus.hasTemplateId ? '✅' : '❌'}</p>
                  <p>API Key: {initStatus.apiKey}</p>
                  <p>Attempts: {initStatus.attempts}</p>
                  <p>Global state: {initStatus.globalInitializing ? '⏳' : '✅'}</p>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white mb-4"
                onClick={handleRetryInitialization}
                disabled={refreshAttempts > 5 || loadingManually}
              >
                <RotateCcw className={`h-4 w-4 mr-1 ${loadingManually ? 'animate-spin' : ''}`} />
                {loadingManually ? "Loading..." : "Retry"}
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white mb-4"
                onClick={handleForceRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh Page
              </Button>
            </div>
            
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
