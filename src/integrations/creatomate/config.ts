
/**
 * Config and helper functions for Creatomate integration
 */

// Check if the Creatomate SDK is available on the window object
export function isCreatomateSDKAvailable(): boolean {
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
    // If SDK is already available, resolve immediately
    if (isCreatomateSDKAvailable()) {
      console.log('Creatomate SDK already loaded');
      resolve();
      return;
    }
    
    console.log('Loading Creatomate SDK dynamically');
    
    // Create a script element to load the SDK
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@creatomate/preview@1.6.0/dist/Preview.min.js';
    script.async = true;
    
    // Set up event handlers
    script.onload = () => {
      console.log('Creatomate SDK loaded successfully');
      resolve();
    };
    
    script.onerror = () => {
      console.error('Failed to load Creatomate SDK, trying fallback');
      
      // Try fallback CDN
      const fallbackScript = document.createElement('script');
      fallbackScript.src = 'https://unpkg.com/@creatomate/preview@1.6.0/dist/Preview.min.js';
      fallbackScript.async = true;
      
      fallbackScript.onload = () => {
        console.log('Creatomate SDK loaded successfully from fallback');
        resolve();
      };
      
      fallbackScript.onerror = () => {
        const error = new Error('Failed to load Creatomate SDK from both primary and fallback sources');
        console.error(error);
        reject(error);
      };
      
      document.head.appendChild(fallbackScript);
    };
    
    document.head.appendChild(script);
  });
}
