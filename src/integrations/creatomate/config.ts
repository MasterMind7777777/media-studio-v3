
/**
 * Config and helper functions for Creatomate integration
 */

// Import the loadScript helper
import { loadCreatomateSdk, isCreatomateSDKAvailable, isCreatomateDisabled } from '@/components/CreatomateLoader';
import { toast } from '@/hooks/use-toast';
import { CREATOMATE_PUBLIC_TOKEN } from '@/config/creatomate';

// Re-export the isCreatomateDisabled flag
export { isCreatomateDisabled, isCreatomateSDKAvailable };

/**
 * Get the Creatomate token from the environment or a default value
 */
export async function getCreatomateToken(): Promise<string> {
  try {
    // First check if we have an environment variable
    const envToken = import.meta.env.VITE_CREATOMATE_TOKEN;
    
    if (envToken) {
      return envToken;
    }
    
    // Fallback to config constant
    if (CREATOMATE_PUBLIC_TOKEN) {
      return CREATOMATE_PUBLIC_TOKEN;
    }
    
    // Final fallback (should never reach this in production)
    console.warn('No Creatomate token found in environment or config, using hardcoded default token');
    return 'public-jb5rna2gay9buhajvtiyp1hb';
  } catch (error) {
    console.error('Error getting Creatomate token:', error);
    // Final fallback
    return 'public-jb5rna2gay9buhajvtiyp1hb';
  }
}

/**
 * Get the Creatomate template ID from the environment or a default value
 */
export async function getCreatomateTemplateId(): Promise<string> {
  // First check if we have an environment variable
  const envTemplateId = import.meta.env.VITE_CREATOMATE_TEMPLATE_ID;
  
  if (envTemplateId) {
    return envTemplateId;
  }
  
  // Fallback to default template ID (for development)
  console.warn('No Creatomate template ID found in environment, using default ID');
  return '36481fd5-8dfe-4359-9544-76d8857acf3d';
}

/**
 * Ensures Creatomate SDK is loaded before proceeding.
 * This function returns a Promise that resolves when the SDK is ready to use.
 */
export async function ensureCreatomateSDK(): Promise<void> {
  // If SDK is disabled, resolve immediately
  if (isCreatomateDisabled) {
    return Promise.resolve();
  }
  
  // If SDK is already available, resolve immediately
  if (isCreatomateSDKAvailable()) {
    return Promise.resolve();
  }
  
  try {
    // Wait for SDK to be loaded
    await loadCreatomateSdk();
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to ensure Creatomate SDK:', error);
    throw error; // Re-throw the error for the caller to handle
  }
}
