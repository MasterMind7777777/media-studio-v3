
import { useRef, useState, useEffect } from 'react';
import { 
  getPreviewInstance, 
  disposePreviewInstance, 
  isCreatomatePreviewDisabled,
  getCreatomateToken
} from '@/lib/loadCreatomatePreview';
import { Preview } from '@creatomate/preview';

export interface PreviewState {
  isReady: boolean;
  error: Error | null;
  isLoading: boolean;
  isPlaying: boolean;
  togglePlay: () => void;
  currentVars: Record<string, any>;
  forceUpdateVariables: (newVars: Record<string, any>) => void;
}

interface UseCreatomatePreviewOptions {
  containerId: string;
  templateId?: string;
  variables?: Record<string, any>;
  onError?: (error: Error) => void;
}

export function useCreatomatePreview(
  { containerId, templateId, variables = {}, onError }: UseCreatomatePreviewOptions
): PreviewState {
  const [previewState, setPreviewState] = useState<PreviewState>({
    isReady: false,
    error: null,
    isLoading: true,
    isPlaying: false,
    togglePlay: () => {},
    currentVars: variables,
    forceUpdateVariables: () => {}
  });

  const [currentVars, setCurrentVars] = useState<Record<string, any>>(variables);
  const previewRef = useRef<Preview | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  // Function to update variables in the preview
  const forceUpdateVariables = (newVars: Record<string, any>) => {
    try {
      if (previewRef.current) {
        // Use immutable update for current variables
        setCurrentVars(newVars);
        
        // Apply to the preview
        previewRef.current.setModifications(newVars);
      }
    } catch (error) {
      console.error('Error updating preview variables:', error);
      if (onError) onError(error as Error);
    }
  };

  // Initialize preview instance
  useEffect(() => {
    let isMounted = true;
    
    // Don't initialize if Creatomate preview is disabled
    if (isCreatomatePreviewDisabled) {
      setPreviewState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: new Error('Creatomate preview disabled via environment variable')
      }));
      return;
    }

    // Function to initialize preview
    const initializePreview = async () => {
      try {
        setPreviewState(prev => ({ ...prev, isLoading: true }));
        
        // Ensure container exists
        containerRef.current = document.getElementById(containerId);
        if (!containerRef.current) {
          throw new Error(`Container #${containerId} not found in the DOM`);
        }
        
        if (!templateId) {
          console.warn('No template ID provided for Creatomate preview');
          setPreviewState(prev => ({ ...prev, isLoading: false, isReady: false }));
          return;
        }

        const token = getCreatomateToken();
        if (!token) {
          throw new Error('Creatomate token not found in environment variables');
        }
        
        // Create the preview instance using the ESM module
        const preview = await getPreviewInstance({
          token,
          templateId, 
          container: containerRef.current,
          mode: 'interactive', // Use interactive mode for editing
          modifications: variables
        });
        
        previewRef.current = preview;

        // Set up event handlers using the correct syntax
        preview.addEventListener('ready', () => {
          if (isMounted) {
            setPreviewState(prev => ({ 
              ...prev, 
              isReady: true, 
              isLoading: false,
              isPlaying: true,
              togglePlay: () => {
                if (preview) {
                  if (preview.isPlaying?.() || false) {
                    preview.pause();
                  } else {
                    preview.play();
                  }
                  
                  // Update playing state
                  setPreviewState(current => ({
                    ...current,
                    isPlaying: !current.isPlaying
                  }));
                }
              },
              currentVars,
              forceUpdateVariables
            }));
          }
        });

        preview.addEventListener('error', (error: Error) => {
          console.error('Creatomate preview error:', error);
          if (isMounted) {
            setPreviewState(prev => ({ 
              ...prev, 
              error, 
              isLoading: false 
            }));
            if (onError) onError(error);
          }
        });
        
        // Handle state changes for play/pause status
        preview.addEventListener('statechange', (event: any) => {
          const state = event.detail;
          if (isMounted && state && typeof state.isPlaying === 'boolean') {
            setPreviewState(prev => ({ ...prev, isPlaying: state.isPlaying }));
          }
        });

      } catch (error) {
        console.error('Failed to initialize Creatomate preview:', error);
        if (isMounted) {
          setPreviewState(prev => ({
            ...prev,
            error: error as Error,
            isLoading: false,
            isReady: false
          }));
          if (onError) onError(error as Error);
        }
      }
    };

    initializePreview();

    return () => {
      isMounted = false;
      // Clean up preview if needed
      if (previewRef.current) {
        try {
          disposePreviewInstance();
          previewRef.current = null;
        } catch (e) {
          console.warn('Error disposing Creatomate preview:', e);
        }
      }
    };
  }, [containerId, templateId, onError, variables]);

  return {
    ...previewState,
    currentVars,
    forceUpdateVariables
  };
}
