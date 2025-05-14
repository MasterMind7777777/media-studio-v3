
import { useState, useEffect } from 'react';

interface CreatomateSDKState {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
}

// Track the loading state globally
let sdkPromise: Promise<void> | null = null;
let loadAttempts = 0;
const MAX_LOAD_ATTEMPTS = 3;
const LOAD_TIMEOUT = 10000; // 10 seconds

// Get the Creatomate token using the correct Vite env variable
const getCreatomateToken = (): string => {
  return import.meta.env.VITE_CREATOMATE_TOKEN || '';
};

/**
 * Loads the Creatomate SDK script only once per application lifecycle
 * with proper error handling and duplicate prevention
 */
export const loadCreatomateSdk = (): Promise<void> => {
  if (sdkPromise) {
    return sdkPromise;
  }

  // Reset load attempts on new page loads
  loadAttempts = 0;

  sdkPromise = new Promise((resolve, reject) => {
    // Check if SDK is already loaded
    if (window.Creatomate) {
      console.log('Creatomate SDK is already loaded');
      resolve();
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[data-creatomate="true"]')) {
      console.log('Creatomate SDK script is already being loaded');
      
      // Create a listener for the already loading script
      const waitForLoad = () => {
        if (window.Creatomate) {
          resolve();
          window.removeEventListener('creatomate-sdk-loaded', waitForLoad);
        }
      };
      
      window.addEventListener('creatomate-sdk-loaded', waitForLoad, { once: true });
      return;
    }

    const loadSDK = () => {
      loadAttempts++;
      console.log(`Attempting to load Creatomate SDK (attempt ${loadAttempts})`);
      
      const script = document.createElement('script');
      script.src = 'https://cdn.creatomate.com/js/v1/creatomate.min.js';
      script.async = true;
      script.dataset.creatomate = 'true';
      
      // Set up timeout to detect loading failures
      const timeoutId = setTimeout(() => {
        if (!window.Creatomate) {
          console.error(`SDK load timed out after ${LOAD_TIMEOUT}ms`);
          
          if (loadAttempts < MAX_LOAD_ATTEMPTS) {
            console.log(`Retrying SDK load (${loadAttempts}/${MAX_LOAD_ATTEMPTS})`);
            loadSDK();
          } else {
            const error = new Error(`Failed to load Creatomate SDK after ${MAX_LOAD_ATTEMPTS} attempts`);
            reject(error);
          }
        }
      }, LOAD_TIMEOUT);
      
      script.onload = () => {
        clearTimeout(timeoutId);
        console.log('Creatomate SDK script loaded successfully');
        
        // Ensure the SDK is actually available
        if (window.Creatomate) {
          console.log('Creatomate SDK ready');
          
          // Initialize with the public token
          const token = getCreatomateToken();
          if (token) {
            console.log('Initializing Creatomate with public token');
            // Reset load attempts counter on successful load
            loadAttempts = 0;
            
            // Dispatch event for any other components waiting
            window.dispatchEvent(new Event('creatomate-sdk-loaded'));
            resolve();
          } else {
            const error = new Error('No Creatomate public token found');
            console.error(error);
            reject(error);
          }
        } else {
          console.error('Script loaded but Creatomate SDK is not defined');
          if (loadAttempts < MAX_LOAD_ATTEMPTS) {
            console.log(`Retrying SDK load (${loadAttempts}/${MAX_LOAD_ATTEMPTS})`);
            loadSDK();
          } else {
            const error = new Error('Creatomate SDK failed to initialize properly');
            reject(error);
          }
        }
      };
      
      script.onerror = (event) => {
        clearTimeout(timeoutId);
        console.error('Failed to load Creatomate SDK script', event);
        
        if (loadAttempts < MAX_LOAD_ATTEMPTS) {
          console.log(`Retrying SDK load (${loadAttempts}/${MAX_LOAD_ATTEMPTS})`);
          loadSDK();
        } else {
          const error = new Error(`Failed to load Creatomate SDK after ${MAX_LOAD_ATTEMPTS} attempts`);
          reject(error);
        }
      };
      
      document.head.appendChild(script);
    };
    
    loadSDK();
  });
  
  return sdkPromise;
};

/**
 * React hook to use the Creatomate SDK loader
 */
export function useCreatomateSDKLoader(): CreatomateSDKState {
  const [state, setState] = useState<CreatomateSDKState>({
    isLoading: true,
    isLoaded: false,
    error: null
  });
  
  useEffect(() => {
    if (import.meta.env.VITE_DISABLE_CREATOMATE === 'true') {
      console.log('Creatomate SDK loading disabled via environment variable');
      setState({
        isLoading: false,
        isLoaded: false,
        error: null
      });
      return;
    }
    
    loadCreatomateSdk()
      .then(() => {
        setState({
          isLoading: false,
          isLoaded: true,
          error: null
        });
      })
      .catch((error) => {
        console.error('Error loading Creatomate SDK:', error);
        setState({
          isLoading: false,
          isLoaded: false,
          error
        });
      });
  }, []);
  
  return state;
}

// Add the global type declaration for Creatomate
declare global {
  interface Window {
    Creatomate?: any;
  }
}
