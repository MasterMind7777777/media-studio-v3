
import { useState, useEffect, useRef } from 'react';
import { formatVariablesForPlayer } from '@/integrations/creatomate/config';
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
  
  // Ref to store the preview instance
  const previewRef = useRef<any>(null);
  
  // Format the variables for the preview
  const formattedVariables = formatVariablesForPlayer(variables);
  
  // Initialize the preview
  useEffect(() => {
    // Skip if no container ID or if window/Creatomate is not available
    if (!containerId || !window.Creatomate?.Preview) {
      console.log('Preview initialization skipped: missing containerId or SDK');
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
      // Create a new preview instance
      const preview = new window.Creatomate.Preview(
        container, 
        'player', 
        import.meta.env.VITE_CREATOMATE_TOKEN || 'public-jb5rna2gay9buhajvtiyp1hb'
      );

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
    if (!previewRef.current || !isReady || Object.keys(formattedVariables).length === 0) {
      return;
    }
    
    console.log('Updating preview variables:', formattedVariables);
    
    try {
      previewRef.current.setModifications(formattedVariables);
    } catch (err) {
      console.error('Error updating preview variables:', err);
      toast.error('Failed to update preview', {
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }, [formattedVariables, isReady]);

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
    preview: previewRef.current
  };
}
