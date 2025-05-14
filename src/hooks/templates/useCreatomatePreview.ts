
import { useState, useEffect, useRef } from 'react';
import { loadCreatomateSdk } from './useCreatomateSDKLoader';

interface CreatomatePreviewOptions {
  containerId: string;
  templateId?: string;
  variables?: Record<string, any>;
  onError?: (error: Error) => void;
}

interface PreviewState {
  currentVars: Record<string, any>;
  forceUpdateVariables: (newVars: Record<string, any>) => void;
  isReady: boolean;
  error: Error | null;
}

export function useCreatomatePreview(options: CreatomatePreviewOptions): PreviewState {
  const { containerId, templateId, variables = {}, onError } = options;
  
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentVars, setCurrentVars] = useState<Record<string, any>>(variables);
  
  const previewRef = useRef<any>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const varsRef = useRef(variables);
  
  // Initialize the preview
  useEffect(() => {
    let isMounted = true;
    
    const initializePreview = async () => {
      try {
        if (!templateId) {
          console.log('No template ID provided, skipping preview initialization');
          return;
        }
        
        // Get container element
        containerRef.current = document.getElementById(containerId);
        if (!containerRef.current) {
          throw new Error(`Container with ID "${containerId}" not found`);
        }
        
        // Ensure SDK is loaded before initializing preview
        await loadCreatomateSdk();
        
        if (!window.Creatomate) {
          throw new Error('Creatomate SDK not available');
        }
        
        if (!isMounted) return;
        
        if (!previewRef.current) {
          // Initialize preview only once
          console.log('Initializing Creatomate preview with template ID:', templateId);
          
          previewRef.current = new window.Creatomate.Preview({
            container: containerRef.current,
            templateId: templateId,
            mode: 'interactive',
            initialVariables: variables,
            onReady: () => {
              if (isMounted) {
                console.log('Creatomate preview ready');
                setIsReady(true);
              }
            },
            onError: (err: Error) => {
              console.error('Creatomate preview error:', err);
              if (isMounted) {
                setError(err);
                if (onError) onError(err);
              }
            },
          });
        }
      } catch (err: any) {
        console.error('Failed to initialize Creatomate preview:', err);
        if (isMounted) {
          setError(err);
          if (onError) onError(err);
        }
      }
    };
    
    // Skip initialization if SDK is disabled
    if (import.meta.env.VITE_DISABLE_CREATOMATE === 'true') {
      console.log('Creatomate preview disabled via environment variable');
      return;
    }
    
    initializePreview();
    
    return () => {
      isMounted = false;
      // Clean up preview instance
      if (previewRef.current) {
        try {
          previewRef.current.destroy();
        } catch (err) {
          console.error('Error destroying Creatomate preview:', err);
        }
        previewRef.current = null;
      }
    };
  }, [containerId, templateId, onError]);
  
  // Update variables when they change
  useEffect(() => {
    varsRef.current = variables;
    setCurrentVars(variables);
    
    if (previewRef.current && isReady) {
      try {
        console.log('Setting preview variables:', variables);
        previewRef.current.setVariables(variables);
      } catch (err) {
        console.error('Error setting preview variables:', err);
      }
    }
  }, [variables, isReady]);
  
  // Force update function
  const forceUpdateVariables = (newVars: Record<string, any>) => {
    try {
      if (previewRef.current && isReady) {
        console.log('Forcing update of preview variables:', newVars);
        previewRef.current.setVariables(newVars);
      }
      setCurrentVars(newVars);
    } catch (err: any) {
      console.error('Error forcing update of preview variables:', err);
      setError(err);
      if (onError) onError(err);
    }
  };
  
  return {
    currentVars,
    forceUpdateVariables,
    isReady,
    error
  };
}
