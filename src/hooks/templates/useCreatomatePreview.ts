import { useState, useEffect, useRef } from 'react';
import { isCreatomateSDKAvailable, ensureCreatomateSDK } from '@/integrations/creatomate/config';
import { toast } from 'sonner';

interface UseCreatomatePreviewProps {
  containerId: string;
  templateId?: string;
  variables?: Record<string, any>;
  autoPlay?: boolean;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

export function useCreatomatePreview({
  containerId,
  templateId,
  variables = {},
  autoPlay = false,
  onReady,
  onError
}: UseCreatomatePreviewProps) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [previewMode, setPreviewMode] = useState<'player' | 'interactive' | null>(null);
  
  // Ref to store the preview instance
  const previewRef = useRef<any>(null);
  
  // Keep track of latest variables to avoid stale closures
  const variablesRef = useRef<Record<string, any>>(variables || {});
  useEffect(() => {
    variablesRef.current = variables || {};
  }, [variables]);
  
  // Function to retry initialization
  const retryInitialization = async () => {
    console.log('Retrying preview initialization');
    setIsLoading(true);
    setError(null);
    
    // Re-initialize the preview if possible
    if (previewRef.current) {
      try {
        previewRef.current.dispose();
      } catch (err) {
        console.error('Error disposing preview during retry:', err);
      }
      previewRef.current = null;
    }
    
    // Try to ensure SDK is loaded before initializing
    try {
      await ensureCreatomateSDK();
      initializePreview();
    } catch (err) {
      console.error('Failed to load SDK during retry:', err);
      setError(err instanceof Error ? err : new Error('Failed to load SDK'));
      setIsLoading(false);
    }
  };
  
  // Function to update preview variables 
  const updatePreviewVariables = (newVars: Record<string, any>) => {
    if (!previewRef.current || !isReady) {
      console.warn('Cannot update variables - preview not ready');
      return false;
    }
    
    try {
      console.log('Updating preview variables:', newVars);
      previewRef.current.setModifications(newVars);
      return true;
    } catch (err) {
      console.error('Error updating preview variables:', err);
      return false;
    }
  };
  
  // Initialize the preview
  const initializePreview = () => {
    // Skip if no container ID or if window/Creatomate is not available
    if (!containerId) {
      console.log('Preview initialization skipped: missing containerId');
      return;
    }

    // Check if the SDK is available
    if (!isCreatomateSDKAvailable()) {
      console.log('Preview initialization skipped: SDK not available');
      setError(new Error('Creatomate SDK not loaded. Please refresh the page and try again.'));
      return;
    }

    // Skip if already initialized
    if (previewRef.current) {
      console.log('Preview already initialized');
      return;
    }

    // Get the container element
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container element with ID ${containerId} not found`);
      setError(new Error(`Container element with ID ${containerId} not found`));
      return;
    }

    console.log('Initializing Creatomate Preview with container:', containerId);
    setIsLoading(true);

    try {
      // Create a new preview instance using the SDK
      const preview = new window.Creatomate.Preview(
        container, 
        'player', 
        import.meta.env.VITE_CREATOMATE_TOKEN || 'public-jb5rna2gay9buhajvtiyp1hb'
      );
      
      // Store the preview mode
      setPreviewMode('player');

      // Setup preview event handlers
      preview.onReady = async () => {
        console.log('Preview ready, loading template:', templateId);
        setIsLoading(true);
        
        try {
          if (templateId) {
            await preview.loadTemplate(templateId);
            console.log('Template loaded successfully');
          } else {
            console.warn('No template ID provided, preview will be empty');
          }
          
          // Set initial time to show something interesting
          await preview.setTime(0.5);
          
          // Apply initial variables if available
          if (Object.keys(variablesRef.current).length > 0) {
            console.log('Setting initial variables:', variablesRef.current);
            preview.setModifications(variablesRef.current);
          }
          
          // Auto play if requested
          if (autoPlay) {
            preview.play();
            setIsPlaying(true);
          }
          
          setIsReady(true);
          setIsLoading(false);
          onReady?.();
        } catch (err) {
          console.error('Error loading template:', err);
          setError(err instanceof Error ? err : new Error('Failed to load template'));
          setIsLoading(false);
          onError?.(err instanceof Error ? err : new Error('Failed to load template'));
          toast.error('Failed to load video template', {
            description: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      };

      preview.onError = (err: Error) => {
        console.error('Preview error:', err);
        setError(err);
        setIsLoading(false);
        onError?.(err);
        toast.error('Video preview error', {
          description: err.message
        });
      };
      
      preview.onTimeUpdate = (time: number) => {
        setCurrentTime(time);
      };
      
      preview.onPlay = () => {
        setIsPlaying(true);
      };
      
      preview.onPause = () => {
        setIsPlaying(false);
      };

      // Store the preview instance
      previewRef.current = preview;
    } catch (err) {
      console.error('Error initializing preview:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize preview'));
      setIsLoading(false);
      onError?.(err instanceof Error ? err : new Error('Failed to initialize preview'));
      toast.error('Failed to initialize video preview', {
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  // Initialize on mount with SDK loading check
  useEffect(() => {
    const loadSDKAndInitialize = async () => {
      setIsLoading(true);
      try {
        await ensureCreatomateSDK();
        initializePreview();
      } catch (err) {
        console.error('Failed to load SDK:', err);
        setError(err instanceof Error ? err : new Error('Failed to load SDK'));
        setIsLoading(false);
      }
    };
    
    loadSDKAndInitialize();

    // Clean up on unmount
    return () => {
      if (previewRef.current) {
        console.log('Disposing preview instance');
        try {
          previewRef.current.dispose();
        } catch (err) {
          console.error('Error disposing preview:', err);
        }
        previewRef.current = null;
      }
    };
  }, [containerId]);
  
  // Update variables when they change
  useEffect(() => {
    if (!previewRef.current || !isReady) {
      return;
    }
    
    // Only update if we have variables
    if (variables && Object.keys(variables).length > 0) {
      console.log('Variables changed, updating preview:', variables);
      updatePreviewVariables(variables);
    }
  }, [variables, isReady]);

  // Media control functions
  const play = () => {
    if (previewRef.current && isReady) {
      previewRef.current.play();
    }
  };
  
  const pause = () => {
    if (previewRef.current && isReady) {
      previewRef.current.pause();
    }
  };
  
  const togglePlay = () => {
    if (previewRef.current && isReady) {
      if (isPlaying) {
        previewRef.current.pause();
      } else {
        previewRef.current.play();
      }
    }
  };
  
  const seekTo = (time: number) => {
    if (previewRef.current && isReady) {
      previewRef.current.setTime(time);
    }
  };
  
  const restart = () => {
    if (previewRef.current && isReady) {
      previewRef.current.setTime(0);
      previewRef.current.play();
    }
  };
  
  // Force update variables programmatically (used by parent components)
  const forceUpdateVariables = (newVars: Record<string, any>) => {
    return updatePreviewVariables(newVars);
  };

  return {
    isReady,
    isLoading,
    error,
    isPlaying,
    currentTime,
    play,
    pause,
    togglePlay,
    seekTo,
    restart,
    preview: previewRef.current,
    previewMode,
    retryInitialization,
    isLoaded: isReady && !isLoading,
    forceUpdateVariables
  };
}
