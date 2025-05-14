
import { useState, useEffect, useRef, useCallback } from 'react';
import { cleanupVariables } from '@/lib/variables';

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
  forceUpdateVariables: (variables: Record<string, any>) => void;
  retryInitialization: () => void;
  togglePlay: () => void;
}

/**
 * Hook for Creatomate preview with dynamic loading support
 * Falls back to mock implementation when SDK is disabled
 */
export function useCreatomatePreview({
  containerId,
  templateId,
  variables = {},
  onReady,
  onError,
}: PreviewOptions): PreviewHook {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(!isCreatomateDisabled);
  const [isPlaying, setIsPlaying] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [previewMode, setPreviewMode] = useState<'interactive' | 'player' | null>(null);
  
  const variablesRef = useRef(variables);
  
  // Update ref when variables change
  useEffect(() => {
    variablesRef.current = variables;
  }, [variables]);
  
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
      // Real SDK initialization would happen here if SDK is enabled
      // This code won't run when VITE_DISABLE_CREATOMATE=true
      console.log('SDK initialization would happen here (disabled for now)');
      setIsLoading(false);
    }
  }, [containerId, onReady, templateId]);
  
  // Mock functions that would normally interact with the SDK
  const forceUpdateVariables = useCallback((newVariables: Record<string, any>) => {
    if (isCreatomateDisabled) {
      console.log('Preview update requested (disabled):', newVariables);
      // Just update the ref
      variablesRef.current = { ...variablesRef.current, ...newVariables };
      return;
    }
    
    // Real implementation would update the preview
    if (preview) {
      console.log('Updating preview variables:', newVariables);
      // preview.setModifications(cleanupVariables(newVariables));
    }
  }, [preview]);
  
  const retryInitialization = useCallback(() => {
    console.log('Retry requested');
    // Implementation would depend on SDK being enabled or disabled
  }, []);
  
  const togglePlay = useCallback(() => {
    console.log('Toggle play requested');
    // Implementation would depend on SDK being enabled or disabled
  }, []);
  
  return {
    isLoading,
    isReady,
    isPlaying,
    preview,
    error,
    previewMode,
    forceUpdateVariables,
    retryInitialization,
    togglePlay
  };
}
