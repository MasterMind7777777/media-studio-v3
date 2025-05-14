
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

// Check if Creatomate SDK is disabled using environment variable
export const isCreatomateDisabled = import.meta.env.VITE_DISABLE_CREATOMATE === 'true';

// Singleton state tracking for Creatomate SDK loader
let isLoadingSDK = false;
let loadPromise: Promise<void> | null = null;
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
  if (loadPromise) {
    console.info('Using existing Creatomate SDK load promise');
    return loadPromise;
  }
  
  // Create and store the load promise
  loadPromise = new Promise<void>((resolve, reject) => {
    // Check if we've exceeded max attempts
    if (loadAttempts >= MAX_ATTEMPTS) {
      const error = new Error(`Creatomate SDK load failed after ${loadAttempts} attempts`);
      dispatchErrorEvent(error);
      reject(error);
      loadPromise = null;
      return;
    }
    
    loadAttempts++;
    isLoadingSDK = true;
    console.info(`📥 Loading Creatomate SDK (attempt ${loadAttempts})...`);
    
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
    const existingScript = document.querySelector('script[src*="creatomate"]');
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
  }).finally(() => {
    // Reset the promise on completion to allow retrying on failure
    if (!window.__CREATOMATE_SDK_LOADED__) {
      loadPromise = null;
    }
  });
  
  return loadPromise;
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
    
    // Load the SDK
    loadCreatomateSdk().catch((error) => {
      // Only show toast for actual failures, not disabled SDK
      if (!isCreatomateDisabled) {
        console.error('Failed to load Creatomate SDK:', error);
        toast({
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
