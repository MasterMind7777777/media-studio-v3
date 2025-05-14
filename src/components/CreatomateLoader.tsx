
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Check if Creatomate SDK should be disabled using environment variable
const isCreatomateDisabled = import.meta.env.VITE_DISABLE_CREATOMATE === 'true';

/**
 * Component that conditionally loads the Creatomate SDK
 * Uses dynamic ESM imports to avoid CommonJS exports errors
 */
export function CreatomateLoader() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    async function loadCreatomateSDK() {
      if (isCreatomateDisabled) {
        console.log('Creatomate SDK loading has been disabled by environment variable');
        return;
      }

      try {
        console.log('Dynamically importing Creatomate SDK');
        // Using dynamic ESM import to avoid CommonJS exports errors
        await import('https://cdn.jsdelivr.net/npm/@creatomate/preview@1.6.0/dist/Preview.min.js');
        console.log('Creatomate SDK loaded successfully');
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load Creatomate SDK, trying fallback', error);
        
        try {
          // Try fallback source if primary fails
          await import('https://unpkg.com/@creatomate/preview@1.6.0/dist/Preview.min.js');
          console.log('Creatomate SDK loaded from fallback source');
          setIsLoaded(true);
        } catch (fallbackError) {
          console.error('Failed to load Creatomate SDK from fallback source', fallbackError);
          setIsError(true);
          toast.error('Failed to load video preview SDK');
        }
      }
    }

    loadCreatomateSDK();
    
    // Store disabled state for components that need to check it
    if (isCreatomateDisabled) {
      localStorage.setItem('creatomate-sdk-disabled', 'true');
    } else {
      localStorage.removeItem('creatomate-sdk-disabled');
    }
  }, []);

  // This component doesn't render anything
  return null;
}
