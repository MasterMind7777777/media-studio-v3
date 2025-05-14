
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

// Standardize SDK availability detection
const isCreatomateDisabled = import.meta.env.VITE_DISABLE_CREATOMATE === 'true';

// Helper function to load external scripts
export const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.type = 'text/javascript'; // Changed from module to text/javascript
    script.async = true;
    
    script.onload = () => resolve();
    script.onerror = (e) => reject(new Error(`Failed to load script: ${src}`));
    
    document.body.appendChild(script);
  });
};

export function CreatomateLoader() {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Skip loading if disabled via env variable
    if (isCreatomateDisabled) {
      console.info('Creatomate SDK is disabled via environment variables');
      return;
    }
    
    // Prevent duplicate loading
    if (window.Creatomate || loading || loaded) {
      return;
    }
    
    const loadSDK = async () => {
      try {
        setLoading(true);
        
        // Try loading from the CDN
        await loadScript('https://cdn.creatomate.com/js/sdk/latest/creatomate.js');
        
        // Give the script a moment to initialize
        setTimeout(() => {
          // Ensure the SDK is available
          if (!window.Creatomate) {
            throw new Error('Creatomate SDK loaded but not available in window');
          }
          
          console.info('✓ Creatomate SDK loaded');
          setLoaded(true);
          setLoading(false);
        }, 500); // Increased timeout to ensure SDK has time to initialize
      } catch (err) {
        console.error('Error loading Creatomate SDK:', err);
        
        // Try fallback CDN
        try {
          await loadScript('https://unpkg.com/@creatomate/preview@latest/dist/index.js');
          
          setTimeout(() => {
            if (!window.Creatomate) {
              throw new Error('Creatomate SDK fallback loaded but not available in window');
            }
            
            console.info('✓ Creatomate SDK loaded from fallback');
            setLoaded(true);
            setLoading(false);
          }, 500);
        } catch (fallbackErr) {
          const errMsg = fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error loading SDK';
          setError(errMsg);
          setLoading(false);
          toast({
            title: "Failed to load preview",
            description: errMsg,
            variant: "destructive"
          });
        }
      }
    };
    
    loadSDK();
    
    // Cleanup function to handle component unmount
    return () => {
      // Nothing specific to clean up for script loading
    };
  }, []);
  
  // This component doesn't render anything visible
  return null;
}
