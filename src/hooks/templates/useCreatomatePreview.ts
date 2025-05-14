
import { useState, useEffect, useCallback, useRef } from 'react';
import { cleanupVariables } from '@/lib/variables';
import { useDebouncedCallback } from '@/hooks/utils/useDebouncedCallback';
import { toast } from '@/hooks/use-toast';
import { isCreatomateDisabled, loadCreatomateSdk, isCreatomateSDKAvailable } from '@/components/CreatomateLoader';
import { ensureCreatomateSDK, getCreatomateToken } from '@/integrations/creatomate/config';

interface PreviewOptions {
  containerId: string;
  templateId?: string;
  variables?: Record<string, any>;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

interface PreviewHook {
  isLoading: boolean;
  isReady: boolean;
  isPlaying: boolean;
  preview: any;
  error: Error | null;
  previewMode: 'interactive' | 'player' | null;
  currentVars: Record<string, any>;
  forceUpdateVariables: (variables: Record<string, any>) => void;
  retryInitialization: () => void;
  togglePlay: () => void;
}

/**
 * Hook for Creatomate preview with dynamic loading support
 */
export function useCreatomatePreview({
  containerId,
  templateId,
  variables = {},
  onReady,
  onError,
}: PreviewOptions): PreviewHook {
  // State setup for all hook properties
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(!isCreatomateDisabled);
  const [isPlaying, setIsPlaying] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [previewMode, setPreviewMode] = useState<'interactive' | 'player' | null>(null);
  const [currentVars, setCurrentVars] = useState<Record<string, any>>(variables);
  
  // Track initialization state and reference to the preview instance
  const initializationAttempted = useRef(false);
  const containerRef = useRef<HTMLElement | null>(null);
  const previewRef = useRef<any>(null);
  
  // Initialize with provided variables
  useEffect(() => {
    if (Object.keys(variables).length > 0) {
      setCurrentVars(prevVars => ({...prevVars, ...variables}));
    }
  }, [variables]);
  
  // Debounced function to update preview with new variables
  const debouncedUpdatePreview = useDebouncedCallback((newVars: Record<string, any>) => {
    if (isCreatomateDisabled || !previewRef.current) return;
    
    try {
      console.log('Updating preview variables (debounced):', newVars);
      const cleanVars = cleanupVariables(newVars);
      previewRef.current.setModifications(cleanVars);
    } catch (err) {
      console.error('Failed to update preview with new variables:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, 150);
  
  // Handle SDK ready event
  useEffect(() => {
    const handleSDKReady = () => {
      console.log('SDK ready event received, initializing preview');
      initializePreviewInstance();
    };
    
    const handleSDKError = (event: any) => {
      const { error } = event.detail;
      console.error('SDK error event received:', error);
      setError(error);
      setIsLoading(false);
      onError?.(error);
      
      // Deduplicate toast error message
      toast({
        id: 'creatomate-preview-error',
        title: "Preview Error",
        description: error.message || "Failed to initialize video preview",
        variant: "destructive"
      });
    };
    
    // Add event listeners for SDK ready/error events
    window.addEventListener('creatomate-sdk-ready', handleSDKReady);
    window.addEventListener('creatomate-sdk-error', handleSDKError);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('creatomate-sdk-ready', handleSDKReady);
      window.removeEventListener('creatomate-sdk-error', handleSDKError);
    };
  }, [containerId, templateId, onReady, onError]);
  
  // Function to initialize the preview instance
  const initializePreviewInstance = useCallback(async () => {
    // Skip if already attempted or disabled
    if (initializationAttempted.current || isCreatomateDisabled) return;
    
    initializationAttempted.current = true;
    setIsLoading(true);
    
    try {
      // Ensure container exists
      const container = document.getElementById(containerId);
      containerRef.current = container;
      
      if (!container) {
        throw new Error(`Container with ID "${containerId}" not found`);
      }
      
      // Ensure SDK is loaded first
      await loadCreatomateSdk();
      
      // Double check SDK is available
      if (!window.Creatomate || typeof window.Creatomate.Preview !== 'function') {
        throw new Error('Creatomate SDK not loaded or initialized');
      }
      
      // Get the token for initialization
      const token = await getCreatomateToken();
      
      // Create preview instance only if not already created
      if (!previewRef.current) {
        console.log('Creating Creatomate Preview instance');
        
        previewRef.current = new window.Creatomate.Preview({
          container,
          mode: 'interactive',
          token: token,
        });
        
        // Store the preview instance in component state
        setPreview(previewRef.current);
        
        // Setup event listeners
        previewRef.current.onReady = () => {
          console.log('Preview is ready');
          setIsReady(true);
          setIsLoading(false);
          setPreviewMode('interactive');
          onReady?.();
          
          // Load template if provided
          if (templateId) {
            console.log('Loading template:', templateId);
            previewRef.current.loadTemplate(templateId);
          }
          
          // Apply initial variables
          if (Object.keys(currentVars).length > 0) {
            console.log('Applying initial variables:', currentVars);
            const cleanVars = cleanupVariables(currentVars);
            previewRef.current.setModifications(cleanVars);
          }
        };
        
        previewRef.current.onError = (err: Error) => {
          console.error('Preview error:', err);
          setError(err);
          setIsLoading(false);
          onError?.(err);
          
          // Deduplicate toast error message
          toast({
            id: 'creatomate-preview-error',
            title: "Preview Error",
            description: err.message || "An error occurred with the preview",
            variant: "destructive"
          });
        };
        
        previewRef.current.onPlay = () => {
          setIsPlaying(true);
        };
        
        previewRef.current.onPause = () => {
          setIsPlaying(false);
        };
      }
    } catch (err) {
      console.error('Failed to initialize preview:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsLoading(false);
      onError?.(error);
      
      // Only show toast for actual failures, not disabled SDK
      if (!isCreatomateDisabled) {
        // Deduplicate toast error message
        toast({
          id: 'creatomate-preview-error',
          title: "Preview Error",
          description: error.message || "Failed to initialize video preview",
          variant: "destructive"
        });
      }
    }
  }, [containerId, templateId, currentVars, onReady, onError]);
  
  // Initialize preview or mock when component mounts
  useEffect(() => {
    // For disabled SDK mode, use a mock implementation
    if (isCreatomateDisabled) {
      console.log('Creatomate preview disabled - using mock implementation');
      
      // Simulate ready state after a short delay
      const timer = setTimeout(() => {
        setIsReady(true);
        setIsLoading(false);
        setPreviewMode('interactive');
        onReady?.();
        
        // Insert a placeholder element
        const container = document.getElementById(containerId);
        containerRef.current = container;
        
        if (container) {
          container.innerHTML = `
            <div class="absolute inset-0 flex flex-col items-center justify-center bg-muted">
              <div class="text-xl font-medium mb-2">Preview Disabled</div>
              <p class="text-sm text-muted-foreground mb-4">Creatomate SDK temporarily disabled for development</p>
              <div class="w-3/4 aspect-video bg-background/40 rounded flex items-center justify-center">
                <div class="text-muted-foreground">Template Preview Placeholder</div>
              </div>
            </div>
          `;
        }
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      // Check if SDK is already available, otherwise wait for the ready event
      if (isCreatomateSDKAvailable()) {
        initializePreviewInstance();
      } else {
        // Start loading the SDK (this will trigger the 'creatomate-sdk-ready' event when done)
        loadCreatomateSdk().catch(error => {
          setError(error);
          setIsLoading(false);
          onError?.(error);
        });
      }
    }
    
    // Cleanup function
    return () => {
      if (previewRef.current && typeof previewRef.current.dispose === 'function') {
        try {
          previewRef.current.dispose();
        } catch (err) {
          console.error('Error disposing preview:', err);
        }
        previewRef.current = null;
      }
    };
  }, [containerId, templateId, onReady, onError, initializePreviewInstance]);
  
  // Update variables and preview
  const forceUpdateVariables = useCallback((newVariables: Record<string, any>) => {
    // Create a new object to ensure state updates
    setCurrentVars((prevVars) => {
      const updatedVars = {...prevVars, ...newVariables};
      
      // Queue the debounced preview update
      debouncedUpdatePreview(updatedVars);
      
      return updatedVars;
    });
  }, [debouncedUpdatePreview]);
  
  // Retry initialization
  const retryInitialization = useCallback(() => {
    console.log('Retry requested');
    setError(null);
    setIsLoading(true);
    initializationAttempted.current = false;
    
    // Re-trigger the initialization
    const container = containerRef.current;
    if (container) {
      container.innerHTML = '';
    }
    
    // Force a re-render
    setPreview(null);
    previewRef.current = null;
    
    // Initialize again
    initializePreviewInstance();
  }, [initializePreviewInstance]);
  
  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!previewRef.current) return;
    
    if (isPlaying) {
      previewRef.current.pause();
    } else {
      previewRef.current.play();
    }
  }, [isPlaying]);
  
  return {
    isLoading,
    isReady,
    isPlaying,
    preview,
    error,
    previewMode,
    currentVars,
    forceUpdateVariables,
    retryInitialization,
    togglePlay
  };
}
