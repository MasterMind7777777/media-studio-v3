
import { useEffect, useRef, useState, useCallback } from 'react';
import { formatVariablesForPlayer } from '@/integrations/creatomate/config';
import { CREATOMATE_PUBLIC_TOKEN, BASIC_COMPOSITION } from '@/config/creatomate';

interface UseCreatomatePreviewOptions {
  creatomateTemplateId?: string;
  variables?: Record<string, any>;
  containerRef: React.RefObject<HTMLDivElement>;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

interface PreviewError {
  message: string;
  details?: string;
}

export function useCreatomatePreview({
  creatomateTemplateId,
  variables,
  containerRef,
  autoPlay = false,
  loop = true,
  muted = true,
}: UseCreatomatePreviewOptions) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<any>(null);
  const isInitializingRef = useRef(false);

  // Check for mobile/touch-only device
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    // Check if we're on a touch-only device (for mobile fallback)
    setIsTouch(window.matchMedia('(hover: none)').matches);
  }, []);

  // Use player mode for touch devices, interactive for desktop
  const previewMode = isTouch ? 'player' : 'interactive';
  
  // Initialize Creatomate Preview when DOM is ready
  const initializePreview = useCallback(() => {
    // Skip if already initializing
    if (isInitializingRef.current) {
      return;
    }
    
    // Clear any previous errors
    setError(null);
    isInitializingRef.current = true;

    try {
      // Check requirements
      if (!containerRef.current) {
        throw new Error('Container element is not available');
      }
      
      if (!CREATOMATE_PUBLIC_TOKEN) {
        throw new Error('Creatomate API token is missing. Set VITE_CREATOMATE_TOKEN in .env file');
      }
      
      if (!window.Creatomate?.Preview) {
        throw new Error('Creatomate SDK is not loaded. Check the script tag in index.html');
      }

      // Clean up previous instance if it exists
      if (previewRef.current) {
        try {
          previewRef.current.dispose();
        } catch (e) {
          console.warn('Error disposing previous preview:', e);
        }
      }

      console.log(`Initializing Creatomate preview in ${previewMode} mode`);
      
      // Create the preview in interactive mode
      previewRef.current = new window.Creatomate.Preview(
        containerRef.current,
        previewMode,
        CREATOMATE_PUBLIC_TOKEN
      );
      
      // Set up event handlers
      previewRef.current.onError = (previewError: PreviewError) => {
        const errorMessage = previewError?.message || 'Unknown error';
        console.error('Creatomate preview error:', previewError);
        setError(`Preview error: ${errorMessage}`);
        setIsLoaded(false);
        isInitializingRef.current = false;
      };
      
      previewRef.current.onReady = async () => {
        console.log('Creatomate preview ready, loading template or composition...');
        
        try {
          if (creatomateTemplateId) {
            // Load template if ID is provided
            console.log(`Loading template with ID: ${creatomateTemplateId}`);
            await previewRef.current.loadTemplate(creatomateTemplateId);
          } else {
            // Fall back to basic composition if no template ID
            console.log('No template ID provided, loading basic composition');
            await previewRef.current.setSource(BASIC_COMPOSITION);
          }
          
          // Format variables for the preview
          if (variables && Object.keys(variables).length > 0) {
            const formattedVariables = formatVariablesForPlayer(variables);
            previewRef.current.setModifications(formattedVariables);
            console.log('Applied modifications:', formattedVariables);
          }
          
          console.log('Template/composition loaded successfully');
          setIsLoaded(true);
          setError(null);
          
          if (autoPlay) {
            previewRef.current.play();
            setIsPlaying(true);
          }
        } catch (templateError: any) {
          console.error('Error loading template/composition:', templateError);
          setError(`Failed to load content: ${
            templateError?.message || 'Unknown error'
          }`);
        } finally {
          isInitializingRef.current = false;
        }
      };
      
      previewRef.current.onStateChange = (state: any) => {
        setIsPlaying(state.isPlaying || false);
      };
      
    } catch (error: any) {
      console.error('Error initializing Creatomate preview:', error);
      setError(`Initialization error: ${error?.message || 'Unknown error'}`);
      setIsLoaded(false);
      isInitializingRef.current = false;
    }
  }, [creatomateTemplateId, variables, autoPlay, containerRef, previewMode]);

  // Initialize preview when dependencies change
  useEffect(() => {
    // Reset state
    setIsLoaded(false);
    if (error) setError(null);
    
    // Add a small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(initializePreview, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      
      // Dispose preview if it exists
      if (previewRef.current) {
        try {
          console.log('Disposing Creatomate preview');
          previewRef.current.dispose();
          previewRef.current = null;
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

  // Get current preview mode
  const getPreviewMode = useCallback(() => {
    return previewMode;
  }, [previewMode]);

  // Manual retry function
  const retryInitialization = useCallback(() => {
    console.log('Manually retrying preview initialization');
    isInitializingRef.current = false;
    setError(null);
    initializePreview();
  }, [initializePreview]);

  return {
    isLoaded,
    isPlaying,
    error,
    play,
    pause,
    toggle,
    updateVariables,
    getPreviewMode,
    retryInitialization,
    previewMode
  };
}
