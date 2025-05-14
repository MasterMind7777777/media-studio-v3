
/**
 * Config and helper functions for Creatomate integration
 */

// Import the loadScript helper
import { loadScript } from '@/components/CreatomateLoader';
import { toast } from '@/hooks/use-toast';

// Check if Creatomate SDK is disabled using environment variable
export const isCreatomateDisabled = import.meta.env.VITE_DISABLE_CREATOMATE === 'true';

// Check if the Creatomate SDK is available on the window object
export function isCreatomateSDKAvailable(): boolean {
  if (isCreatomateDisabled) {
    return false;
  }
  
  return typeof window !== 'undefined' && 
    window.Creatomate !== undefined;
}

/**
 * Get the Creatomate token from the environment or a default value
 */
export async function getCreatomateToken(): Promise<string> {
  // First check if we have an environment variable
  const envToken = import.meta.env.VITE_CREATOMATE_TOKEN;
  
  if (envToken) {
    console.log('Using Creatomate token from environment variables');
    return envToken;
  }
  
  // Fallback to default token (for development)
  console.warn('No Creatomate token found in environment, using default token');
  return 'public-jb5rna2gay9buhajvtiyp1hb';
}

/**
 * Get the Creatomate template ID from the environment or a default value
 */
export async function getCreatomateTemplateId(): Promise<string> {
  // First check if we have an environment variable
  const envTemplateId = import.meta.env.VITE_CREATOMATE_TEMPLATE_ID;
  
  if (envTemplateId) {
    console.log('Using Creatomate template ID from environment variables');
    return envTemplateId;
  }
  
  // Fallback to default template ID (for development)
  console.warn('No Creatomate template ID found in environment, using default ID');
  return '36481fd5-8dfe-4359-9544-76d8857acf3d';
}

// Track SDK load attempts
let loadAttempts = 0;
let loadingPromise: Promise<void> | null = null;

// Helper to ensure SDK script is loaded
export function ensureCreatomateSDK(): Promise<void> {
  // If we already have a loading promise in progress, return it
  if (loadingPromise) {
    return loadingPromise;
  }
  
  loadingPromise = new Promise<void>((resolve, reject) => {
    // If SDK is disabled, resolve immediately
    if (isCreatomateDisabled) {
      console.log('Creatomate SDK is disabled by environment variable');
      resolve();
      return;
    }
    
    // If SDK is already available, resolve immediately
    if (isCreatomateSDKAvailable()) {
      console.log('Creatomate SDK already loaded');
      resolve();
      return;
    }
    
    // Prevent too many load attempts
    if (loadAttempts >= 2) {
      const error = new Error(`Creatomate SDK load failed after ${loadAttempts} attempts`);
      console.error(error);
      toast({
        title: "Failed to load preview",
        description: "Too many load attempts. Please refresh the page.",
        variant: "destructive"
      });
      reject(error);
      return;
    }
    
    console.log(`Loading Creatomate SDK dynamically (attempt ${loadAttempts + 1})`);
    loadAttempts++;
    
    // Try to load the SDK
    loadScript('https://cdn.creatomate.com/js/sdk/latest/creatomate.js')
      .then(() => {
        // Give the script time to initialize
        setTimeout(() => {
          if (window.Creatomate) {
            console.log('Creatomate SDK loaded successfully');
            resolve();
          } else {
            console.error('Creatomate SDK script loaded but global not available');
            reject(new Error('Creatomate SDK not initialized correctly'));
          }
        }, 300);
      })
      .catch((error) => {
        console.error('Failed to load Creatomate SDK, trying fallback', error);
        
        // Try fallback URL
        loadScript('https://unpkg.com/@creatomate/preview@latest/dist/index.js')
          .then(() => {
            setTimeout(() => {
              if (window.Creatomate) {
                console.log('Creatomate SDK loaded from fallback');
                resolve();
              } else {
                reject(new Error('Creatomate SDK fallback loaded but not initialized'));
              }
            }, 300);
          })
          .catch((fallbackError) => {
            const error = new Error('Failed to load Creatomate SDK from both sources');
            console.error(error);
            reject(error);
          });
      })
      .finally(() => {
        // Reset the loading promise so we can try again if needed
        loadingPromise = null;
      });
  });
  
  return loadingPromise;
}
