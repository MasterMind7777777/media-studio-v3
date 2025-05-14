
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { getCreatomateToken } from '@/integrations/creatomate/config';

// Check if Creatomate SDK is disabled using environment variable
export const isCreatomateDisabled = import.meta.env.VITE_DISABLE_CREATOMATE === 'true';

// Singleton state tracking for Creatomate SDK loader
let isLoadingSDK = false;
let sdkPromise: Promise<void> | null = null;
let loadAttempts = 0;
const MAX_ATTEMPTS = 2;

/**
 * Dispatches a custom event when the Creatomate SDK is ready
 */
function dispatchReadyEvent(): void {
  const event = new CustomEvent('creatomate-sdk-ready');
  window.dispatchEvent(event);
  console.info('✅ Creatomate SDK Ready Event Dispatched');
}

/**
 * Dispatches a custom event when there's an error loading the Creatomate SDK
 */
function dispatchErrorEvent(error: Error): void {
  const event = new CustomEvent('creatomate-sdk-error', { 
    detail: { error } 
  });
  window.dispatchEvent(event);
  console.error('❌ Creatomate SDK Error Event Dispatched:', error);
}

/**
 * Resets the load attempts counter when navigating between pages
 */
export function resetLoadAttempts(): void {
  loadAttempts = 0;
  console.info('Creatomate SDK load attempts reset');
}

/**
 * Loads Creatomate SDK script and returns a promise that resolves when SDK is ready
 * Implements a singleton pattern to prevent multiple load attempts
 */
export function loadCreatomateSdk(): Promise<void> {
  // If SDK is disabled, resolve immediately
  if (isCreatomateDisabled) {
    console.info('Creatomate SDK is disabled via environment variables');
    return Promise.resolve();
  }
  
  // If SDK is already available, resolve immediately
  if (window.Creatomate && typeof window.Creatomate.Preview === 'function') {
    console.info('Creatomate SDK already loaded and initialized');
    window.__CREATOMATE_SDK_LOADED__ = true;
    return Promise.resolve();
  }
  
  // Return existing promise if loading is in progress
  if (sdkPromise) {
    console.info('Using existing Creatomate SDK load promise');
    return sdkPromise;
  }
  
  // Create and store the load promise
  sdkPromise = new Promise<void>(async (resolve, reject) => {
    try {
      // Check if we've exceeded max attempts
      if (loadAttempts >= MAX_ATTEMPTS) {
        const error = new Error(`Creatomate SDK load failed after ${loadAttempts} attempts`);
        dispatchErrorEvent(error);
        reject(error);
        sdkPromise = null;
        return;
      }
      
      loadAttempts++;
      isLoadingSDK = true;
      console.info(`📥 Loading Creatomate SDK (attempt ${loadAttempts})...`);
      
      // Get the token before proceeding
      const token = await getCreatomateToken();
      console.info('Using Creatomate token:', token ? 'Valid token obtained' : 'No token available');
      
      // Function to detect when SDK is actually ready
      const checkSDKReady = () => {
        if (window.Creatomate && typeof window.Creatomate.Preview === 'function') {
          window.__CREATOMATE_SDK_LOADED__ = true;
          console.info('✅ Creatomate SDK loaded and initialized successfully');
          dispatchReadyEvent();
          isLoadingSDK = false;
          resolve();
        } else {
          const error = new Error('Creatomate SDK loaded but Preview class not available');
          console.error('❌ SDK load failed:', error.message);
          dispatchErrorEvent(error);
          isLoadingSDK = false;
          reject(error);
        }
      };
      
      // Check if script is already loaded but not initialized
      const existingScript = document.querySelector('script[data-creatomate="true"]');
      if (existingScript) {
        console.info('Creatomate script tag already exists, checking initialization...');
        // Give it a moment to check if it's just not initialized yet
        setTimeout(checkSDKReady, 300);
        return;
      }
      
      // Create and append script element
      const script = document.createElement('script');
      script.src = 'https://cdn.creatomate.com/js/sdk/latest/creatomate.js';
      script.type = 'text/javascript';
      script.async = true;
      script.dataset.creatomate = 'true'; // Add data attribute to identify script
      
      // Set up success handler
      script.onload = () => {
        console.info('Script tag loaded, waiting for SDK initialization...');
        // Check if SDK is available after script loads
        setTimeout(checkSDKReady, 300);
      };
      
      // Set up error handler for primary URL
      script.onerror = () => {
        console.warn('Primary SDK source failed, trying fallback...');
        
        // Try fallback URL
        const fallbackScript = document.createElement('script');
        fallbackScript.src = 'https://unpkg.com/@creatomate/preview@latest/dist/index.js';
        fallbackScript.type = 'text/javascript';
        fallbackScript.async = true;
        fallbackScript.dataset.creatomate = 'true'; // Add data attribute to identify script
        
        fallbackScript.onload = () => {
          console.info('Fallback script loaded, checking initialization...');
          setTimeout(checkSDKReady, 300);
        };
        
        fallbackScript.onerror = (e) => {
          const error = new Error('Failed to load Creatomate SDK from both sources');
          console.error('❌ SDK load failed completely:', error);
          dispatchErrorEvent(error);
          isLoadingSDK = false;
          reject(error);
        };
        
        document.body.appendChild(fallbackScript);
      };
      
      // Add the script to the page
      document.body.appendChild(script);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error during SDK loading');
      console.error('❌ Exception during SDK loading:', err);
      isLoadingSDK = false;
      reject(err);
      sdkPromise = null;
    }
  }).finally(() => {
    // Reset the promise on completion to allow retrying on failure
    if (!window.__CREATOMATE_SDK_LOADED__) {
      sdkPromise = null;
    }
  });
  
  return sdkPromise;
}

/**
 * Check if the SDK is already loaded and available
 */
export function isCreatomateSDKAvailable(): boolean {
  if (isCreatomateDisabled) return false;
  return window.__CREATOMATE_SDK_LOADED__ === true || 
         (typeof window.Creatomate !== 'undefined' && 
          typeof window.Creatomate.Preview === 'function');
}

/**
 * React component that loads the Creatomate SDK once when mounted
 */
export function CreatomateLoader() {
  useEffect(() => {
    // Skip if SDK is disabled
    if (isCreatomateDisabled) return;
    
    // Reset load attempts on component mount
    resetLoadAttempts();
    
    // Load the SDK
    loadCreatomateSdk().catch((error) => {
      // Only show toast for actual failures, not disabled SDK
      if (!isCreatomateDisabled) {
        console.error('Failed to load Creatomate SDK:', error);
        // Deduplicate toast error messages
        toast({
          id: 'creatomate-sdk-error',
          title: "Failed to load preview",
          description: "The video preview engine couldn't be loaded. Please try refreshing the page.",
          variant: "destructive"
        });
      }
    });
    
    // Clean up event listeners on unmount
    return () => {
      // No specific cleanup needed for script loading
    };
  }, []);
  
  // This component doesn't render anything visible
  return null;
}
