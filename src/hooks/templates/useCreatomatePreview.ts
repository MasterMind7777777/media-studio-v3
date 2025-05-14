
import { useState, useEffect, useCallback, useRef } from 'react';
import { cleanupVariables } from '@/lib/variables';
import { useDebouncedCallback } from '@/hooks/utils/useDebouncedCallback';

// Check if Creatomate SDK is disabled using environment variable
const isCreatomateDisabled = import.meta.env.VITE_DISABLE_CREATOMATE === 'true';

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
 * Uses state (not ref) for variables to ensure proper re-rendering
 * Falls back to mock implementation when SDK is disabled
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
  
  // Initialize with provided variables
  useEffect(() => {
    setCurrentVars(prevVars => ({...prevVars, ...variables}));
  }, [variables]);
  
  // Reference for preview container element
  const containerRef = useRef<HTMLElement | null>(null);
  
  // Debounced function to update preview with new variables
  const debouncedUpdatePreview = useDebouncedCallback((newVars: Record<string, any>) => {
    if (isCreatomateDisabled || !preview) return;
    
    try {
      console.log('Updating preview variables (debounced):', newVars);
      const cleanVars = cleanupVariables(newVars);
      preview.setModifications(cleanVars);
    } catch (err) {
      console.error('Failed to update preview with new variables:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, 150);
  
  // Initialize preview or mock when component mounts
  useEffect(() => {
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
      // Real SDK initialization
      const initializePreview = async () => {
        try {
          setIsLoading(true);
          
          // Dynamically import Creatomate types
          const container = document.getElementById(containerId);
          containerRef.current = container;
          
          if (!container) {
            throw new Error(`Container with ID "${containerId}" not found`);
          }
          
          // Check if SDK is available on window
          if (!window.Creatomate || !window.Creatomate.Preview) {
            throw new Error('Creatomate SDK not loaded');
          }
          
          // Create preview instance
          const previewInstance = new window.Creatomate.Preview({
            container,
            mode: 'interactive',
            token: import.meta.env.VITE_CREATOMATE_TOKEN,
          });
          
          // Setup event listeners
          previewInstance.onReady = () => {
            console.log('Preview is ready');
            setIsReady(true);
            setIsLoading(false);
            setPreviewMode('interactive');
            onReady?.();
            
            // Load template if provided
            if (templateId) {
              previewInstance.loadTemplate(templateId);
            }
            
            // Apply initial variables
            if (Object.keys(currentVars).length > 0) {
              const cleanVars = cleanupVariables(currentVars);
              previewInstance.setModifications(cleanVars);
            }
          };
          
          previewInstance.onError = (error: Error) => {
            console.error('Preview error:', error);
            setError(error);
            setIsLoading(false);
            onError?.(error);
          };
          
          previewInstance.onPlay = () => {
            setIsPlaying(true);
          };
          
          previewInstance.onPause = () => {
            setIsPlaying(false);
          };
          
          // Store preview instance in state
          setPreview(previewInstance);
          
        } catch (err) {
          console.error('Failed to initialize preview:', err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
          onError?.(err instanceof Error ? err : new Error(String(err)));
        }
      };
      
      initializePreview();
    }
    
    // Cleanup function
    return () => {
      if (preview && typeof preview.dispose === 'function') {
        preview.dispose();
      }
    };
  }, [containerId, templateId, onReady, onError, currentVars]);
  
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
    
    // Re-trigger the useEffect
    const container = containerRef.current;
    if (container) {
      container.innerHTML = '';
    }
    
    // Force a re-render
    setPreview(null);
  }, []);
  
  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!preview) return;
    
    if (isPlaying) {
      preview.pause();
    } else {
      preview.play();
    }
  }, [preview, isPlaying]);
  
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
