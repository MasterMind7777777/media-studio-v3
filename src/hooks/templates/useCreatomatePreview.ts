
import { useState, useEffect, useRef, useCallback } from 'react';
import { normalizeKeys, cleanupVariables } from '@/lib/variables';

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
  forceUpdateVariables: (variables: Record<string, any>) => void;
  retryInitialization: () => void;
  togglePlay: () => void;
}

/**
 * Hook to initialize and manage Creatomate preview in a container
 */
export function useCreatomatePreview({
  containerId,
  templateId,
  variables = {},
  onReady,
  onError,
}: PreviewOptions): PreviewHook {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [previewMode, setPreviewMode] = useState<'interactive' | 'player' | null>(null);
  const previewRef = useRef<any>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const initAttempted = useRef(false);
  const latestVariables = useRef(variables);

  // Keep the latest variables ref updated
  useEffect(() => {
    latestVariables.current = variables;
  }, [variables]);

  // Initialize the preview with normalized variables
  const initializePreview = useCallback(async () => {
    if (!templateId || !containerId) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Initializing Creatomate preview in container:', containerId);
      setIsLoading(true);
      setError(null);
      
      // Wait for the window.Creatomate object to be available
      if (!window.Creatomate) {
        console.log('Creatomate SDK not loaded yet, waiting...');
        setTimeout(initializePreview, 1000); // Retry after 1s
        return;
      }
      
      // Get the container element
      containerRef.current = document.getElementById(containerId);
      if (!containerRef.current) {
        throw new Error(`Container element with ID '${containerId}' not found`);
      }
      
      // Get the token from environment variable
      const token = import.meta.env.VITE_CREATOMATE_TOKEN;
      if (!token) {
        throw new Error('Creatomate token not found in environment variables');
      }

      // Clean and normalize the variables before passing to Creatomate
      const cleanedVars = cleanupVariables(latestVariables.current);
      const normalizedVariables = normalizeKeys(cleanedVars);
      console.log('Initializing preview with normalized variables:', normalizedVariables);
      
      // Initialize the preview with the public token
      previewRef.current = new window.Creatomate.Preview({
        token,
        templateId,
        container: containerRef.current,
        format: 'mp4',
        mode: 'interactive',
        modifications: normalizedVariables,
        onReady: () => {
          console.log('Creatomate preview ready');
          setIsReady(true);
          setIsLoading(false);
          setPreviewMode('interactive');
          onReady?.();
        },
        onError: (err: Error) => {
          console.error('Creatomate preview error:', err);
          setIsLoading(false);
          setError(err);
          onError?.(err);
        },
        onStateChange: (state: any) => {
          // Update playing state based on playback state
          if (state && state.playback) {
            setIsPlaying(state.playback === 'playing');
          }
        }
      });
      
      initAttempted.current = true;
    } catch (error: any) {
      console.error('Error initializing Creatomate preview:', error);
      setIsLoading(false);
      setError(error);
      onError?.(error);
    }
  }, [containerId, templateId, onReady, onError]);
  
  // Handle play/pause toggle
  const togglePlay = useCallback(() => {
    if (!previewRef.current || !isReady) {
      console.log('Preview not ready to toggle play state');
      return;
    }
    
    try {
      if (isPlaying) {
        previewRef.current.pause();
      } else {
        previewRef.current.play();
      }
    } catch (error) {
      console.error('Error toggling play state:', error);
    }
  }, [isReady, isPlaying]);
  
  // Force update the preview with new variables
  const forceUpdateVariables = useCallback((newVariables: Record<string, any>) => {
    if (!previewRef.current || !isReady) {
      console.log('Preview not ready to update variables');
      return;
    }
    
    try {
      // Clean and normalize the variables before updating
      const cleanedVars = cleanupVariables(newVariables);
      const normalizedVariables = normalizeKeys(cleanedVars);
      console.log('Updating preview with normalized variables:', normalizedVariables);
      
      // Apply the variables to the preview
      previewRef.current.setModifications(normalizedVariables);
    } catch (error: any) {
      console.error('Error updating preview variables:', error);
      onError?.(error);
    }
  }, [isReady, onError]);
  
  // Retry initialization if it failed
  const retryInitialization = useCallback(() => {
    if (previewRef.current) {
      previewRef.current = null;
    }
    setIsReady(false);
    setIsLoading(true);
    setError(null);
    initializePreview();
  }, [initializePreview]);
  
  // Initialize the preview when the component mounts or dependencies change
  useEffect(() => {
    if (!initAttempted.current) {
      initializePreview();
    }
    
    // Cleanup when the component unmounts
    return () => {
      if (previewRef.current) {
        previewRef.current = null;
      }
    };
  }, [initializePreview]);
  
  return {
    isLoading,
    isReady,
    isPlaying,
    preview: previewRef.current,
    error,
    previewMode,
    forceUpdateVariables,
    retryInitialization,
    togglePlay
  };
}
