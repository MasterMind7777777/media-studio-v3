
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Create event names for the SDK loading
const SDK_LOADED_EVENT = 'creatomate-sdk-loaded';
const SDK_ERROR_EVENT = 'creatomate-sdk-error';

// Primary and fallback URLs for the Creatomate Preview SDK
const PRIMARY_SDK_URL = 'https://cdn.jsdelivr.net/npm/@creatomate/preview@1.6.0/dist/preview.min.js';
const FALLBACK_SDK_URL = 'https://unpkg.com/@creatomate/preview@1.6.0/dist/preview.min.js';

// Maximum number of retry attempts
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Check if preview is enabled via environment variable
const isPreviewEnabled = import.meta.env.VITE_CREATOMATE_PREVIEW !== 'off';

/**
 * Hook to load and manage the Creatomate SDK
 */
export function useCreatomateSDKLoader() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Don't load if preview is disabled
    if (!isPreviewEnabled) {
      return;
    }

    // Check if SDK already loaded
    if (window.Creatomate?.Preview) {
      console.log('Creatomate Preview SDK already available in window');
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
        console.error(`Failed to load Creatomate SDK (attempt ${retryCount + 1}/${MAX_RETRIES}):`, err);
        
        // Retry logic
        if (retryCount < MAX_RETRIES - 1) {
          setRetryCount(prev => prev + 1);
          setError(null); // Clear previous error during retry
          
          // Display retry toast only on first attempt
          if (retryCount === 0) {
            toast({
              title: "Retrying SDK load",
              description: "Attempting to reload the video preview SDK...",
              duration: 3000
            });
          }
        } else {
          // Max retries reached
          setError(err as Error);
          setIsLoading(false);
          toast({
            variant: "destructive",
            title: "Failed to load video preview",
            description: "Please check your internet connection and try refreshing the page.",
            duration: 5000
          });
        }
      }
    };

    // Listen for global events (useful for multiple components trying to load SDK)
    const handleSDKLoaded = () => {
      console.log('SDK loaded event received');
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

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[data-creatomate="true"]');
    
    // If retrying or first attempt and no existing script, load SDK
    if (retryCount > 0 || !existingScript) {
      // Use setTimeout for retry delay
      const timer = setTimeout(() => {
        loadSDK();
      }, retryCount > 0 ? RETRY_DELAY : 0);
      
      return () => clearTimeout(timer);
    } else if (!window.Creatomate?.Preview) {
      // Script tag exists but SDK not ready yet
      setIsLoading(true);
    }

    // Cleanup
    return () => {
      window.removeEventListener(SDK_LOADED_EVENT, handleSDKLoaded);
      window.removeEventListener(SDK_ERROR_EVENT, handleSDKError);
    };
  }, [retryCount, toast]);

  return { isLoading, isLoaded, error };
}

/**
 * Safely loads the Creatomate SDK script with error handling and deduplication
 * @returns A promise that resolves when the SDK is loaded and ready
 */
export function loadCreatomateSdk(): Promise<typeof window.Creatomate.Preview> {
  // Default to primary SDK URL
  const sdkUrl = PRIMARY_SDK_URL;
  
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
      if (window.Creatomate?.Preview) {
        console.log('Creatomate Preview SDK already loaded');
        // Dispatch event for any listeners
        window.dispatchEvent(new CustomEvent(SDK_LOADED_EVENT));
        return resolve(window.Creatomate.Preview);
      }

      // Remove any existing failed script tags
      const existingScripts = document.querySelectorAll('script[data-creatomate="true"]');
      existingScripts.forEach(script => {
        if (!script.hasAttribute('data-loaded')) {
          script.remove();
        }
      });

      console.log('Loading Creatomate Preview SDK from:', sdkUrl);
      
      // Create and append script
      const script = document.createElement('script');
      script.src = sdkUrl;
      script.async = true;
      script.dataset.creatomate = 'true';
      
      // Handle load success
      script.onload = () => {
        script.dataset.loaded = 'true';
        console.log('Creatomate Preview SDK script loaded successfully');
        
        // Validate SDK was properly initialized
        if (window.Creatomate?.Preview) {
          console.log('Creatomate Preview SDK initialized successfully');
          // Dispatch event and resolve promise
          window.dispatchEvent(new CustomEvent(SDK_LOADED_EVENT));
          resolve(window.Creatomate.Preview);
        } else {
          console.error('Script loaded but Creatomate.Preview not available');
          // Try fallback URL if this was the primary URL
          if (script.src === PRIMARY_SDK_URL) {
            console.log('Trying fallback SDK URL:', FALLBACK_SDK_URL);
            script.src = FALLBACK_SDK_URL;
            return; // Wait for onload to fire again
          }
          
          const error = new Error('Creatomate Preview SDK failed to initialize after script load');
          window.dispatchEvent(new CustomEvent(SDK_ERROR_EVENT, {
            detail: { error }
          }));
          reject(error);
        }
      };
      
      // Handle load error
      script.onerror = () => {
        console.error('Error loading Creatomate SDK from:', script.src);
        
        // Try fallback URL if this was the primary URL
        if (script.src === PRIMARY_SDK_URL) {
          console.log('Trying fallback SDK URL:', FALLBACK_SDK_URL);
          script.src = FALLBACK_SDK_URL;
          return; // Wait for onload/onerror to fire again
        }
        
        const error = new Error(`Failed to load Creatomate Preview SDK from ${script.src}`);
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
  return !!window.Creatomate?.Preview;
};
