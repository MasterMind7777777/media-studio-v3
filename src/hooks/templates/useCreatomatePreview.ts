
import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  CREATOMATE_PUBLIC_API_KEY, 
  formatVariablesForPlayer,
  waitForCreatomateSDK,
  isCreatomateSDKAvailable,
  loadCreatomateSDKManually
} from '@/integrations/creatomate/config';

interface UseCreatomatePreviewOptions {
  creatomateTemplateId?: string;
  variables?: Record<string, any>;
  containerRef: React.RefObject<HTMLDivElement>;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  skipAutoRetry?: boolean;
}

export function useCreatomatePreview({
  creatomateTemplateId,
  variables,
  containerRef,
  autoPlay = false,
  loop = true,
  muted = true,
  skipAutoRetry = false,
}: UseCreatomatePreviewOptions) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<any>(null);
  const initializationAttempts = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const isInitializingRef = useRef(false);
  const MAX_INITIALIZATION_ATTEMPTS = 3;

  // Initialize Creatomate Preview when SDK is ready
  const initializePreview = useCallback(async () => {
    if (!creatomateTemplateId || !containerRef.current) {
      const missingParts = [];
      if (!creatomateTemplateId) missingParts.push('template ID');
      if (!containerRef.current) missingParts.push('container element');
      
      setError(`Cannot initialize preview: Missing ${missingParts.join(' and ')}`);
      return;
    }
    
    // Prevent multiple initialization attempts
    if (isInitializingRef.current) {
      console.log('Preview initialization already in progress...');
      return;
    }
    
    isInitializingRef.current = true;
    setError(null);
    
    try {
      console.log(`Initializing Creatomate preview with template ID: ${creatomateTemplateId}`);
      console.log('Container dimensions:', 
                  containerRef.current.clientWidth, 
                  containerRef.current.clientHeight);
      
      // Clean up previous instance if it exists
      if (previewRef.current) {
        try {
          console.log('Disposing previous preview instance');
          previewRef.current.dispose();
        } catch (e) {
          console.warn('Error disposing previous preview:', e);
        }
      }
      
      // Format variables for the preview
      const formattedVariables = formatVariablesForPlayer(variables);
      
      // Check again that the SDK is available
      if (!window.Creatomate?.Preview) {
        throw new Error('Creatomate Preview SDK not available');
      }
      
      // Create the preview in interactive mode
      previewRef.current = new window.Creatomate.Preview(
        containerRef.current,
        'interactive',
        CREATOMATE_PUBLIC_API_KEY
      );
      
      console.log('Preview instance created');
      
      // Set up event handlers
      previewRef.current.onError = (e: any) => {
        const errorMessage = e?.message || 'Unknown error';
        console.error('Creatomate preview error:', errorMessage);
        setError(`Preview error: ${errorMessage}`);
        setIsLoaded(false);
        isInitializingRef.current = false;
      };
      
      previewRef.current.onReady = async () => {
        console.log('Creatomate preview ready, loading template...');
        try {
          // Load the template when the preview is ready
          await previewRef.current.loadTemplate(creatomateTemplateId);
          console.log('Template loaded successfully');
          setIsLoaded(true);
          setError(null);
          isInitializingRef.current = false;
          
          // Apply initial modifications if any
          if (Object.keys(formattedVariables).length > 0) {
            previewRef.current.setModifications(formattedVariables);
            console.log('Applied initial modifications:', formattedVariables);
          }
          
          if (autoPlay) {
            previewRef.current.play();
            setIsPlaying(true);
          }
        } catch (templateError) {
          console.error('Error loading template:', templateError);
          setError(`Failed to load template: ${
            templateError instanceof Error ? templateError.message : 'Unknown error'
          }`);
          isInitializingRef.current = false;
        }
      };
      
      previewRef.current.onStateChange = (state: any) => {
        console.log('Preview state changed:', state);
        setIsPlaying(state.isPlaying || false);
      };
      
    } catch (error) {
      console.error('Error initializing Creatomate preview:', error);
      setError(`Initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoaded(false);
      isInitializingRef.current = false;
      
      // Try again if we haven't reached the maximum attempts
      if (!skipAutoRetry && initializationAttempts.current < MAX_INITIALIZATION_ATTEMPTS) {
        initializationAttempts.current++;
        const retryDelay = 2000 * initializationAttempts.current; // Exponential backoff
        
        console.log(`Retrying initialization in ${retryDelay}ms (attempt ${initializationAttempts.current}/${MAX_INITIALIZATION_ATTEMPTS})`);
        
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
          isInitializingRef.current = false;
          initializePreview();
        }, retryDelay);
      }
    }
  }, [creatomateTemplateId, variables, autoPlay, containerRef, skipAutoRetry]);
  
  // Load SDK and initialize preview
  useEffect(() => {
    // Reset state
    setIsLoaded(false);
    setError(null);
    initializationAttempts.current = 0;
    
    // Start loading SDK if template ID is provided
    if (creatomateTemplateId) {
      console.log(`Loading SDK for template: ${creatomateTemplateId}`);
      
      // Wait for SDK to be available
      const loadSDK = async () => {
        try {
          // First check if SDK is already available
          if (isCreatomateSDKAvailable()) {
            console.log('SDK already available, initializing preview');
            initializePreview();
            return;
          }
          
          // Try waiting for SDK
          await waitForCreatomateSDK();
          console.log('SDK loaded, initializing preview');
          initializePreview();
        } catch (error) {
          console.error('Error waiting for SDK:', error);
          
          // Try loading SDK manually as fallback
          try {
            await loadCreatomateSDKManually();
            console.log('SDK loaded manually, initializing preview');
            initializePreview();
          } catch (manualError) {
            console.error('Failed to load SDK manually:', manualError);
            setError(`SDK loading error: ${
              manualError instanceof Error ? manualError.message : 'Unknown error'
            }`);
          }
        }
      };
      
      // Add a small delay to ensure DOM is fully rendered
      setTimeout(loadSDK, 100);
    }
    
    // Cleanup function
    return () => {
      // Clear any pending timeouts
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      
      // Dispose preview if it exists
      if (previewRef.current) {
        try {
          console.log('Disposing Creatomate preview');
          previewRef.current.dispose();
        } catch (e) {
          console.error('Error disposing preview:', e);
        }
      }
    };
  }, [creatomateTemplateId, initializePreview]);

  // Update variables when they change
  useEffect(() => {
    if (isLoaded && previewRef.current && variables) {
      try {
        console.log('Updating preview variables:', variables);
        const formattedVariables = formatVariablesForPlayer(variables);
        previewRef.current.setModifications(formattedVariables);
      } catch (e) {
        console.error('Error updating variables:', e);
      }
    }
  }, [variables, isLoaded]);
  
  // Control functions
  const play = useCallback(() => {
    if (previewRef.current && isLoaded) {
      previewRef.current.play();
      setIsPlaying(true);
    }
  }, [isLoaded]);
  
  const pause = useCallback(() => {
    if (previewRef.current && isLoaded) {
      previewRef.current.pause();
      setIsPlaying(false);
    }
  }, [isLoaded]);
  
  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);
  
  // Update preview with new variables
  const updateVariables = useCallback((newVariables: Record<string, any>) => {
    if (previewRef.current && isLoaded) {
      try {
        const formattedVariables = formatVariablesForPlayer(newVariables);
        previewRef.current.setModifications(formattedVariables);
      } catch (e) {
        console.error('Error updating variables:', e);
      }
    }
  }, [isLoaded]);

  // Helper for debugging
  const getInitializationStatus = useCallback(() => {
    return {
      sdkLoaded: isCreatomateSDKAvailable(),
      hasWindow: typeof window !== 'undefined',
      hasCreatomateSDK: typeof window !== 'undefined' && !!window.Creatomate,
      hasContainer: !!containerRef.current,
      hasTemplateId: !!creatomateTemplateId,
      hasPreview: !!previewRef.current,
      apiKey: CREATOMATE_PUBLIC_API_KEY ? 'Valid' : 'Missing',
      attempts: initializationAttempts.current,
      initializing: isInitializingRef.current,
    };
  }, [creatomateTemplateId, containerRef]);

  // Manual retry function
  const retryInitialization = useCallback(() => {
    console.log('Manually triggering preview initialization retry');
    initializationAttempts.current = 0;
    isInitializingRef.current = false;
    setError(null);
    
    loadCreatomateSDKManually()
      .then(() => {
        setTimeout(initializePreview, 500);
      })
      .catch(() => {
        initializePreview();
      });
  }, [initializePreview]);

  return {
    isLoaded,
    isPlaying,
    error,
    play,
    pause,
    toggle,
    updateVariables,
    getInitializationStatus,
    retryInitialization
  };
}
