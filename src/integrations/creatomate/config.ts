
/**
 * Configuration for the Creatomate integration
 * Note: This is the public API key which is safe to use in the frontend
 * The private key should only be used in serverless functions
 */
export const CREATOMATE_PUBLIC_API_KEY = "73ad3003-d7fb-4a07-a2d2-6091c7543945";

/**
 * Helper function to ensure template variables are formatted correctly for Creatomate
 * @param variables The template variables to format
 * @returns Formatted variables ready for the Creatomate player
 */
export function formatVariablesForPlayer(variables: Record<string, any> = {}): Record<string, any> {
  // Make a copy to avoid mutating the original
  const formattedVariables = { ...variables };
  
  // Check if variables is empty or undefined
  if (!variables || Object.keys(variables).length === 0) {
    console.log('No variables to format');
    return {};
  }
  
  console.log('Formatting variables for player:', variables);
  
  // Simple validation to ensure we have proper format
  Object.entries(formattedVariables).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      console.warn(`Variable ${key} has null or undefined value, removing it`);
      delete formattedVariables[key];
    }
  });
  
  return formattedVariables;
}

/**
 * Maximum retry attempts for player initialization
 */
export const MAX_INITIALIZATION_RETRIES = 5; // Increased from 3 to 5

/**
 * Delay in ms before initializing player after SDK load check
 */
export const SDK_INITIALIZATION_DELAY = 1000; // Increased from 800 to 1000

/**
 * Base delay between initialization retry attempts in ms
 * We'll implement exponential backoff based on this value
 */
export const BASE_RETRY_DELAY = 1000; // Base delay for exponential backoff

/**
 * Maximum waiting time for SDK load in ms
 */
export const SDK_LOAD_TIMEOUT = 15000; // Increased from 5000 to 15000

/**
 * Time between SDK availability checks in ms
 */
export const SDK_CHECK_INTERVAL = 500; // Reduced from 1000 to check more frequently

/**
 * Global state to prevent multiple initialization attempts
 */
let globalInitializationInProgress = false;

/**
 * Set global initialization status
 */
export function setGlobalInitializationStatus(status: boolean): void {
  globalInitializationInProgress = status;
}

/**
 * Get global initialization status
 */
export function getGlobalInitializationStatus(): boolean {
  return globalInitializationInProgress;
}

/**
 * Check if the global SDK loaded flag has been set
 */
export function isSDKLoadedByEvent(): boolean {
  return typeof window !== 'undefined' && !!window.creatomateSDKLoaded;
}

/**
 * Enhanced check for Creatomate SDK availability in the window object
 * This performs multiple levels of validation
 */
export function isCreatomateSDKAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check if SDK was loaded via the onload event
  if (isSDKLoadedByEvent()) {
    console.log('SDK loaded flag detected');
  }
  
  // More thorough check for SDK availability
  const hasCreatomateObject = typeof window.Creatomate !== 'undefined' && window.Creatomate !== null;
  
  if (hasCreatomateObject) {
    console.log('Creatomate object exists with keys:', Object.keys(window.Creatomate));
    
    // Check if critical components are available
    const hasPlayerConstructor = typeof window.Creatomate?.Player === 'function';
    
    if (!hasPlayerConstructor) {
      console.warn('Creatomate object exists but Player constructor is missing!');
    } else {
      console.log('Creatomate Player constructor is available');
    }
    
    return hasPlayerConstructor;
  }
  
  return false;
}

/**
 * Force a manual page refresh - for when the SDK won't load any other way
 */
export function forcePageRefresh(): void {
  console.log('Forcing page refresh to reload Creatomate SDK');
  window.location.reload();
}

/**
 * Creates a promise that resolves when the SDK is loaded via the onload event
 */
export function waitForSDKLoadEvent(timeout = SDK_LOAD_TIMEOUT): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // If SDK already loaded by event, resolve immediately
    if (isSDKLoadedByEvent()) {
      console.log('✅ SDK loaded flag already set');
      resolve(true);
      return;
    }

    console.log(`Waiting for creatomate-sdk-loaded event (timeout: ${timeout}ms)...`);
    
    // Set up the timeout for rejection
    const timeoutId = setTimeout(() => {
      window.removeEventListener('creatomate-sdk-loaded', eventHandler);
      reject(new Error(`SDK load event not fired within ${timeout}ms`));
    }, timeout);
    
    // Set up the event listener
    function eventHandler() {
      console.log('✅ creatomate-sdk-loaded event received');
      clearTimeout(timeoutId);
      resolve(true);
    }
    
    window.addEventListener('creatomate-sdk-loaded', eventHandler);
  });
}

/**
 * Function to wait for SDK to be available with a timeout
 * Now with multiple detection strategies
 * @returns Promise that resolves when SDK is available or rejects on timeout
 */
export function waitForCreatomateSDK(timeout = SDK_LOAD_TIMEOUT): Promise<boolean> {
  // Store a reference to track if we already completed this check
  let completed = false;
  
  return new Promise((resolve, reject) => {
    // Strategy 1: Check if SDK is already directly available
    if (isCreatomateSDKAvailable()) {
      console.log('✅ Creatomate SDK is already available');
      return resolve(true);
    }

    // Strategy 2: Try detecting via the event-based approach
    waitForSDKLoadEvent(timeout)
      .then(() => {
        if (!completed && isCreatomateSDKAvailable()) {
          completed = true;
          console.log('✅ SDK detected after load event');
          resolve(true);
        }
      })
      .catch(() => {
        // Event approach failed, continue with polling
        console.log('Event-based SDK detection failed, falling back to polling');
      });
    
    console.log(`Waiting for Creatomate SDK to load (timeout: ${timeout}ms)...`);
    
    // Strategy 3: Set up polling as a fallback
    const timeoutId = setTimeout(() => {
      if (completed) return;
      completed = true;
      
      if (intervalId) clearInterval(intervalId);
      console.error(`❌ Creatomate SDK load timeout after ${timeout}ms`);
      
      // Log detailed diagnostic information
      console.error('SDK detection failed. Window.Creatomate:', window.Creatomate ? 'exists' : 'missing');
      if (window.Creatomate) {
        console.error('Available Creatomate properties:', Object.keys(window.Creatomate));
      }
      
      reject(new Error(`Creatomate SDK not loaded within ${timeout}ms`));
    }, timeout);
    
    // Check for SDK availability every interval
    const intervalId = setInterval(() => {
      if (completed) {
        clearInterval(intervalId);
        return;
      }
      
      if (isCreatomateSDKAvailable()) {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
        completed = true;
        console.log('✅ Creatomate SDK loaded successfully via polling');
        resolve(true);
      }
    }, SDK_CHECK_INTERVAL);
  });
}

/**
 * Fallback method to load Creatomate SDK dynamically
 */
export function loadCreatomateSDKManually(): Promise<boolean> {
  console.log('🔄 Attempting to load Creatomate SDK manually...');
  
  return new Promise((resolve, reject) => {
    // Check if SDK is already loaded
    if (isCreatomateSDKAvailable()) {
      console.log('SDK already available, no need to load manually');
      return resolve(true);
    }
    
    // Check if script already exists
    const existingScript = document.getElementById('creatomate-sdk');
    if (existingScript) {
      console.log('SDK script tag already exists, will not add another one');
      return waitForCreatomateSDK()
        .then(() => resolve(true))
        .catch(err => reject(err));
    }
    
    // Create script element
    const script = document.createElement('script');
    script.id = 'creatomate-sdk';
    script.src = 'https://cdn.jsdelivr.net/npm/creatomate@1.2.1/dist/index.min.js';
    script.async = true;
    
    // Set up loading handlers
    script.onload = () => {
      console.log('Manual SDK script loaded successfully');
      window.creatomateSDKLoaded = true;
      window.dispatchEvent(new Event('creatomate-sdk-loaded'));
      
      // Wait for a moment to ensure SDK is initialized
      setTimeout(() => {
        if (isCreatomateSDKAvailable()) {
          resolve(true);
        } else {
          reject(new Error('SDK loaded but not available after script load'));
        }
      }, 1000);
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Creatomate SDK script manually'));
    };
    
    // Add to document
    document.body.appendChild(script);
  });
}

// Add TypeScript interface for Window with Creatomate property
declare global {
  interface Window {
    Creatomate?: any;
    creatomateSDKLoaded?: boolean;
  }
}
