
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Check if Creatomate SDK should be disabled using environment variable
const isCreatomateDisabled = import.meta.env.VITE_DISABLE_CREATOMATE === 'true';

/**
 * Component that conditionally loads the Creatomate SDK
 * Uses native script loading instead of ESM imports to avoid TypeScript errors
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
        console.log('Dynamically loading Creatomate SDK');
        
        // Using native script loading instead of dynamic ESM imports
        const loadScript = (url: string): Promise<void> => {
          return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = url;
            script.async = true;
            script.onload = () => {
              console.log(`Script loaded successfully: ${url}`);
              resolve();
            };
            script.onerror = (error) => {
              console.error(`Error loading script: ${url}`, error);
              reject(new Error(`Failed to load script: ${url}`));
            };
            document.body.appendChild(script);
          });
        };

        // Try to load from primary source
        await loadScript('https://cdn.jsdelivr.net/npm/@creatomate/preview@1.6.0/dist/Preview.min.js');
        console.log('Creatomate SDK loaded successfully');
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load Creatomate SDK, trying fallback', error);
        
        try {
          // Try fallback source if primary fails
          await loadScript('https://unpkg.com/@creatomate/preview@1.6.0/dist/Preview.min.js');
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

// Helper function for loading scripts, exported for reuse
export function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.async = true;
    script.onload = () => {
      console.log(`Script loaded successfully: ${url}`);
      resolve();
    };
    script.onerror = (error) => {
      console.error(`Error loading script: ${url}`, error);
      reject(new Error(`Failed to load script: ${url}`));
    };
    document.body.appendChild(script);
  });
}
