
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
export const MAX_INITIALIZATION_RETRIES = 3; // Reduced from 7 to 3 to prevent infinite cycles

/**
 * Delay in ms before initializing player after SDK load check
 */
export const SDK_INITIALIZATION_DELAY = 800;

/**
 * Delay between initialization retry attempts in ms
 */
export const RETRY_DELAY = 2000; // Increased from 1500

/**
 * Maximum waiting time for SDK load in ms
 */
export const SDK_LOAD_TIMEOUT = 5000; // Reduced from 10000 to 5000

/**
 * Time between SDK availability checks in ms
 */
export const SDK_CHECK_INTERVAL = 1000; 

/**
 * Check if Creatomate SDK is available in the window object
 * This uses a more thorough check than before
 */
export function isCreatomateSDKAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  // More thorough check for SDK availability
  const hasCreatomateObject = typeof window.Creatomate !== 'undefined' && window.Creatomate !== null;
  const hasPlayerConstructor = hasCreatomateObject && typeof window.Creatomate?.Player === 'function';

  if (hasCreatomateObject) {
    console.log('Creatomate object exists:', !!hasCreatomateObject);
    if (!hasPlayerConstructor) {
      console.warn('Creatomate object exists but Player constructor is missing!');
    }
  }
  
  return hasPlayerConstructor;
}

/**
 * Force a manual page refresh - for when the SDK won't load any other way
 */
export function forcePageRefresh(): void {
  console.log('Forcing page refresh to reload Creatomate SDK');
  window.location.reload();
}

/**
 * Function to wait for SDK to be available with a timeout
 * @returns Promise that resolves when SDK is available or rejects on timeout
 */
export function waitForCreatomateSDK(timeout = SDK_LOAD_TIMEOUT): Promise<boolean> {
  // Store a reference to track if we already completed this check
  let completed = false;
  
  return new Promise((resolve, reject) => {
    // If SDK is already available, resolve immediately
    if (isCreatomateSDKAvailable()) {
      console.log('✅ Creatomate SDK is already available');
      return resolve(true);
    }

    console.log(`Waiting for Creatomate SDK to load (timeout: ${timeout}ms)...`);
    
    // Set a timeout to reject the promise if SDK doesn't load in time
    const timeoutId = setTimeout(() => {
      if (completed) return;
      completed = true;
      
      if (intervalId) clearInterval(intervalId);
      console.error(`❌ Creatomate SDK load timeout after ${timeout}ms`);
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
        console.log('✅ Creatomate SDK loaded successfully');
        resolve(true);
      }
    }, SDK_CHECK_INTERVAL);
  });
}

