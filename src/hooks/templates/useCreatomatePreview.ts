
import { useRef, useState, useEffect } from 'react';
import { useCreatomateSDKLoader, isCreatomateSDKAvailable } from './useCreatomateSDKLoader';
import { isCreatomateDisabled } from '@/components/CreatomateLoader';

export interface PreviewState {
  isReady: boolean;
  error: Error | null;
  isLoading: boolean;
  isPlaying: boolean;
  togglePlay: () => void;
}

interface UseCreatomatePreviewOptions {
  containerId: string;
  templateId?: string;
  variables?: Record<string, any>;
  onError?: (error: Error) => void;
}

export function useCreatomatePreview(
  { containerId, templateId, variables = {}, onError }: UseCreatomatePreviewOptions
) {
  // Use our SDK loader hook
  const { isLoaded: isSdkLoaded, error: sdkError } = useCreatomateSDKLoader();
  
  const [previewState, setPreviewState] = useState<PreviewState>({
    isReady: false,
    error: null,
    isLoading: true,
    isPlaying: false,
    togglePlay: () => {}
  });

  const [currentVars, setCurrentVars] = useState<Record<string, any>>(variables);
  const previewRef = useRef<any>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  const forceUpdateVariables = (newVars: Record<string, any>) => {
    try {
      if (previewRef.current && isCreatomateSDKAvailable()) {
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

  // Initialize preview when SDK becomes available
  useEffect(() => {
    let isMounted = true;
    let preview: any = null;
    
    // Don't initialize if Creatomate is disabled
    if (isCreatomateDisabled) {
      setPreviewState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: new Error('Creatomate preview disabled via environment variable')
      }));
      return;
    }

    // Handle SDK loading error
    if (sdkError) {
      if (onError) onError(sdkError);
      setPreviewState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: sdkError 
      }));
      return;
    }

    // Only initialize when SDK is loaded
    if (!isSdkLoaded) {
      return;
    }

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

        const token = import.meta.env.VITE_CREATOMATE_TOKEN;
        if (!token) {
          throw new Error('Creatomate token not found in environment variables');
        }
        
        // Create the preview instance using the Preview SDK
        preview = new window.Creatomate.Preview({
          token,
          templateId, 
          container: containerRef.current,
          mode: 'interactive', // Use interactive mode for editing
          modifications: variables
        });
        
        previewRef.current = preview;

        // Set up event handlers
        preview.on('ready', () => {
          if (isMounted) {
            setPreviewState(prev => ({ 
              ...prev, 
              isReady: true, 
              isLoading: false,
              isPlaying: true,
              togglePlay: () => {
                if (preview) {
                  if (preview.isPlaying()) {
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
              }
            }));
          }
        });

        preview.on('error', (error: Error) => {
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
        preview.on('statechange', (state: any) => {
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
          previewRef.current.dispose();
          previewRef.current = null;
        } catch (e) {
          console.warn('Error disposing Creatomate preview:', e);
        }
      }
    };
  }, [containerId, templateId, isSdkLoaded, sdkError, onError, variables]);

  return {
    ...previewState,
    currentVars,
    forceUpdateVariables
  };
}
