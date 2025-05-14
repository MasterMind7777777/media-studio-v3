
/**
 * Config and helper functions for Creatomate integration
 */

// Import the loadScript helper
import { loadScript } from '@/components/CreatomateLoader';

// Check if Creatomate SDK is disabled using environment variable
export const isCreatomateDisabled = import.meta.env.VITE_DISABLE_CREATOMATE === 'true';

// Check if the Creatomate SDK is available on the window object
export function isCreatomateSDKAvailable(): boolean {
  if (isCreatomateDisabled) {
    return false;
  }
  
  return typeof window !== 'undefined' && 
    window.Creatomate !== undefined && 
    typeof window.Creatomate.Preview === 'function';
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

// Helper to ensure SDK script is loaded
export function ensureCreatomateSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
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
    
    console.log('Loading Creatomate SDK dynamically');
    
    // Use loadScript helper instead of dynamic ESM imports
    loadScript('https://cdn.jsdelivr.net/npm/@creatomate/preview@1.6.0/dist/Preview.min.js')
      .then(() => {
        console.log('Creatomate SDK loaded successfully');
        resolve();
      })
      .catch((error) => {
        console.error('Failed to load Creatomate SDK, trying fallback', error);
        
        // Try fallback CDN
        loadScript('https://unpkg.com/@creatomate/preview@1.6.0/dist/Preview.min.js')
          .then(() => {
            console.log('Creatomate SDK loaded successfully from fallback');
            resolve();
          })
          .catch((fallbackError) => {
            const error = new Error('Failed to load Creatomate SDK from both primary and fallback sources');
            console.error(error);
            reject(error);
          });
      });
  });
}
