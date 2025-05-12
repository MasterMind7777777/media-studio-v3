
/**
 * Configuration for the Creatomate integration
 * Note: This is the public API key which is safe to use in the frontend
 * The private key should only be used in serverless functions
 */
export const CREATOMATE_PUBLIC_API_KEY = "73ad3003-d7fb-4a07-a2d2-6091c7543945";

/**
 * Helper function to ensure template variables are formatted correctly for Creatomate
 * @param variables The template variables to format
 * @returns Formatted variables ready for the Creatomate preview
 */
export function formatVariablesForPlayer(variables: Record<string, any> = {}): Record<string, any> {
  // Make a copy to avoid mutating the original
  const formattedVariables = { ...variables };
  
  // Check if variables is empty or undefined
  if (!variables || Object.keys(variables).length === 0) {
    console.log('No variables to format');
    return {};
  }
  
  console.log('Formatting variables for preview:', variables);
  
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
 * Simple check if the SDK is loaded and available
 */
export function isCreatomateSDKAvailable(): boolean {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return false;
  }

  // Check if the Preview constructor exists
  return typeof window.Creatomate?.Preview === 'function';
}

/**
 * Check if the global SDK loaded flag has been set
 */
export function isSDKLoadedByEvent(): boolean {
  return typeof window !== 'undefined' && !!window.creatomateSDKLoaded;
}

/**
 * Waits for Creatomate SDK to be available
 * @returns Promise that resolves when SDK is detected
 */
export async function waitForCreatomateSDK(timeout = 10000): Promise<boolean> {
  // If SDK is already available, resolve immediately
  if (isCreatomateSDKAvailable()) {
    console.log('✅ Creatomate SDK is already available');
    return true;
  }
  
  return new Promise((resolve, reject) => {
    console.log(`Waiting for Creatomate SDK to load (timeout: ${timeout}ms)...`);
    
    // Set a timeout to reject if SDK doesn't load
    const timeoutId = setTimeout(() => {
      console.error(`❌ Creatomate SDK load timeout after ${timeout}ms`);
      reject(new Error(`Creatomate SDK not loaded within ${timeout}ms`));
    }, timeout);
    
    // Check for SDK availability every 200ms
    const checkInterval = 200;
    const intervalId = setInterval(() => {
      if (isCreatomateSDKAvailable()) {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
        console.log('✅ Creatomate SDK loaded successfully');
        resolve(true);
      }
    }, checkInterval);
    
    // Listen for the load event as well
    const handleSDKLoaded = () => {
      // Give a small delay to ensure the SDK is fully initialized
      setTimeout(() => {
        if (isCreatomateSDKAvailable()) {
          clearTimeout(timeoutId);
          clearInterval(intervalId);
          window.removeEventListener('creatomate-sdk-loaded', handleSDKLoaded);
          console.log('✅ Creatomate SDK loaded via event');
          resolve(true);
        }
      }, 500);
    };
    
    window.addEventListener('creatomate-sdk-loaded', handleSDKLoaded);
  });
}

/**
 * Load Creatomate SDK manually if needed
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
      console.log('SDK script tag already exists, waiting for it to load');
      return waitForCreatomateSDK(10000)
        .then(() => resolve(true))
        .catch(err => reject(err));
    }
    
    // Create script element
    const script = document.createElement('script');
    script.id = 'creatomate-sdk';
    script.src = 'https://cdn.creatomate.com/preview/preview.js';
    
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
    document.head.appendChild(script);
  });
}

// Add TypeScript interface for Window with Creatomate property
declare global {
  interface Window {
    Creatomate?: {
      Preview?: any;
      Player?: any;
      [key: string]: any;
    };
    creatomateSDKLoaded?: boolean;
  }
}
