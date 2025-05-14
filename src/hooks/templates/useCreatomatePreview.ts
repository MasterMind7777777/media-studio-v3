
import { useState, useEffect, useRef, useCallback } from 'react';
import { cleanupVariables } from '@/lib/variables';

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
 * Mock implementation of Creatomate preview hook
 * Returns predefined values instead of trying to initialize the SDK
 */
export function useCreatomatePreview({
  containerId,
  templateId,
  variables = {},
  onReady,
  onError,
}: PreviewOptions): PreviewHook {
  const [isReady, setIsReady] = useState(false);
  const variablesRef = useRef(variables);
  
  // Update ref when variables change
  useEffect(() => {
    variablesRef.current = variables;
  }, [variables]);
  
  // Simulate initialization process
  useEffect(() => {
    console.log('Creatomate preview disabled - using mock implementation');
    
    // Simulate ready state after a short delay
    const timer = setTimeout(() => {
      setIsReady(true);
      onReady?.();
      
      // Insert a placeholder element
      const container = document.getElementById(containerId);
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
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [containerId, onReady]);
  
  // Mock functions that would normally interact with the SDK
  const forceUpdateVariables = useCallback((newVariables: Record<string, any>) => {
    console.log('Preview update requested (disabled)', newVariables);
    // Just update the ref
    variablesRef.current = { ...variablesRef.current, ...newVariables };
  }, []);
  
  const retryInitialization = useCallback(() => {
    console.log('Retry requested (disabled)');
    // Do nothing in mock implementation
  }, []);
  
  const togglePlay = useCallback(() => {
    console.log('Toggle play requested (disabled)');
    // Do nothing in mock implementation
  }, []);
  
  return {
    isLoading: false,
    isReady: true,
    isPlaying: false,
    preview: null,
    error: null,
    previewMode: 'interactive',
    forceUpdateVariables,
    retryInitialization,
    togglePlay
  };
}
