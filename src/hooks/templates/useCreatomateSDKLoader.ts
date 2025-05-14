// Import necessary modules
import { CreatomatePreviewSDK } from '@/types';

interface CreatomateWindow extends Window {
  Creatomate?: CreatomatePreviewSDK;
}

/**
 * Safely loads the Creatomate SDK script with error handling and deduplication
 * @returns A promise that resolves when the SDK is loaded and ready
 */
export function loadCreatomateSdk(): Promise<CreatomatePreviewSDK> {
  const sdkUrl = 'https://cdn.creatomate.com/latest/creatomate.js';
  let sdkPromise: Promise<CreatomatePreviewSDK> | null = null;

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
      if ((window as CreatomateWindow).Creatomate) {
        console.log('Creatomate SDK already loaded');
        return resolve((window as CreatomateWindow).Creatomate as CreatomatePreviewSDK);
      }

      // Check if script is already being loaded (in case of HMR/double init)
      const existingScript = document.querySelector('script[data-creatomate="true"]');
      if (existingScript) {
        console.log('Creatomate script is already loading, waiting for it to complete');
        
        // If script is loading but not ready, wait for it
        if (!existingScript.hasAttribute('data-loaded')) {
          existingScript.addEventListener('load', () => {
            if ((window as CreatomateWindow).Creatomate) {
              resolve((window as CreatomateWindow).Creatomate as CreatomatePreviewSDK);
            } else {
              reject(new Error('Creatomate failed to initialize after script load'));
            }
          });
          existingScript.addEventListener('error', () => {
            reject(new Error('Failed to load Creatomate SDK script'));
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
        if ((window as CreatomateWindow).Creatomate) {
          resolve((window as CreatomateWindow).Creatomate as CreatomatePreviewSDK);
        } else {
          reject(new Error('Creatomate SDK failed to initialize after script load'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Creatomate SDK script'));
      };
      
      document.head.appendChild(script);
    } catch (error) {
      console.error('Error loading Creatomate SDK:', error);
      reject(error);
    }
  });
}

/**
 * Check if the Creatomate SDK is available in the window object
 */
export const isCreatomateSDKAvailable = (): boolean => {
  return !!(window as CreatomateWindow).Creatomate;
};

// Update the TypeScript declarations for the global window object
declare global {
  interface Window {
    Creatomate: CreatomatePreviewSDK;
  }
}
