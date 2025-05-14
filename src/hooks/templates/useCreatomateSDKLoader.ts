
import { useState, useEffect } from 'react';
import { CreatomatePreviewSDK } from '@/types';

// Create event names for the SDK loading
const SDK_LOADED_EVENT = 'creatomate-sdk-loaded';
const SDK_ERROR_EVENT = 'creatomate-sdk-error';

// Check if preview is enabled via environment variable
const isPreviewEnabled = import.meta.env.VITE_CREATOMATE_PREVIEW !== 'off';

/**
 * Hook to load and manage the Creatomate SDK
 */
export function useCreatomateSDKLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Don't load if preview is disabled
    if (!isPreviewEnabled) {
      return;
    }

    // Check if SDK already loaded
    if (window.Creatomate) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    // Function to load the SDK
    const loadSDK = async () => {
      setIsLoading(true);
      try {
        await loadCreatomateSdk();
        setIsLoaded(true);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load Creatomate SDK:", err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    // Listen for global events (useful for multiple components trying to load SDK)
    const handleSDKLoaded = () => {
      setIsLoaded(true);
      setIsLoading(false);
    };

    const handleSDKError = (event: Event) => {
      if ('detail' in event && (event as any).detail?.error) {
        setError((event as any).detail.error);
      } else {
        setError(new Error('Unknown error loading Creatomate SDK'));
      }
      setIsLoading(false);
    };

    // Add event listeners
    window.addEventListener(SDK_LOADED_EVENT, handleSDKLoaded);
    window.addEventListener(SDK_ERROR_EVENT, handleSDKError);

    // Start loading if not already in progress
    if (!document.querySelector('script[data-creatomate="true"]')) {
      loadSDK();
    } else if (!window.Creatomate) {
      setIsLoading(true); // Script tag exists but SDK not ready yet
    }

    // Cleanup
    return () => {
      window.removeEventListener(SDK_LOADED_EVENT, handleSDKLoaded);
      window.removeEventListener(SDK_ERROR_EVENT, handleSDKError);
    };
  }, []);

  return { isLoading, isLoaded, error };
}

/**
 * Safely loads the Creatomate SDK script with error handling and deduplication
 * @returns A promise that resolves when the SDK is loaded and ready
 */
export function loadCreatomateSdk(): Promise<CreatomatePreviewSDK> {
  const sdkUrl = 'https://cdn.creatomate.com/latest/creatomate.js';

  const getCreatomateToken = (): string => {
    const publicToken = import.meta.env.VITE_CREATOMATE_TOKEN;
    if (!publicToken) {
      console.error('Missing Creatomate public token. Set VITE_CREATOMATE_TOKEN in your .env file');
      throw new Error('Missing Creatomate public token');
    }
    return publicToken;
  };

  return new Promise((resolve, reject) => {
    try {
      // Check if SDK is already loaded
      if (window.Creatomate) {
        console.log('Creatomate SDK already loaded');
        // Dispatch event for any listeners
        window.dispatchEvent(new CustomEvent(SDK_LOADED_EVENT));
        return resolve(window.Creatomate as CreatomatePreviewSDK);
      }

      // Check if script is already being loaded (in case of HMR/double init)
      const existingScript = document.querySelector('script[data-creatomate="true"]');
      if (existingScript) {
        console.log('Creatomate script is already loading, waiting for it to complete');
        
        // If script is loading but not ready, wait for it
        if (!existingScript.hasAttribute('data-loaded')) {
          existingScript.addEventListener('load', () => {
            if (window.Creatomate) {
              // Dispatch event and resolve promise
              window.dispatchEvent(new CustomEvent(SDK_LOADED_EVENT));
              resolve(window.Creatomate as CreatomatePreviewSDK);
            } else {
              const error = new Error('Creatomate failed to initialize after script load');
              window.dispatchEvent(new CustomEvent(SDK_ERROR_EVENT, {
                detail: { error }
              }));
              reject(error);
            }
          });
          existingScript.addEventListener('error', () => {
            const error = new Error('Failed to load Creatomate SDK script');
            window.dispatchEvent(new CustomEvent(SDK_ERROR_EVENT, {
              detail: { error }
            }));
            reject(error);
          });
        }
        return;
      }

      console.log('Loading Creatomate SDK script from:', sdkUrl);
      
      // Create and append script
      const script = document.createElement('script');
      script.src = sdkUrl;
      script.async = true;
      script.dataset.creatomate = 'true';
      
      script.onload = () => {
        script.dataset.loaded = 'true';
        console.log('Creatomate SDK script loaded successfully');
        
        // Check if SDK object was properly initialized
        if (window.Creatomate) {
          // Dispatch event and resolve promise
          window.dispatchEvent(new CustomEvent(SDK_LOADED_EVENT));
          resolve(window.Creatomate as CreatomatePreviewSDK);
        } else {
          const error = new Error('Creatomate SDK failed to initialize after script load');
          window.dispatchEvent(new CustomEvent(SDK_ERROR_EVENT, {
            detail: { error }
          }));
          reject(error);
        }
      };
      
      script.onerror = () => {
        const error = new Error('Failed to load Creatomate SDK script');
        window.dispatchEvent(new CustomEvent(SDK_ERROR_EVENT, {
          detail: { error }
        }));
        reject(error);
      };
      
      document.head.appendChild(script);
    } catch (error) {
      console.error('Error loading Creatomate SDK:', error);
      // Dispatch error event and reject promise
      window.dispatchEvent(new CustomEvent(SDK_ERROR_EVENT, {
        detail: { error }
      }));
      reject(error);
    }
  });
}

/**
 * Check if the Creatomate SDK is available in the window object
 */
export const isCreatomateSDKAvailable = (): boolean => {
  return !!window.Creatomate;
};

// Note: We're using the interface from types/index.ts so no need to redeclare it here
