
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
    script.type = 'module';
    script.async = true;
    script.defer = true;
    
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
        
        // Try loading from the primary CDN
        await loadScript('https://cdn.creatomate.com/js/sdk/1.6.0/creatomate-preview-sdk.min.js');
        
        // Give the script a moment to initialize
        setTimeout(() => {
          // Ensure the SDK is available
          if (!window.Creatomate) {
            throw new Error('Creatomate SDK loaded but not available in window');
          }
          
          console.info('✓ Creatomate SDK loaded');
          setLoaded(true);
          setLoading(false);
        }, 100);
      } catch (err) {
        console.error('Error loading Creatomate SDK:', err);
        
        // Try fallback CDN
        try {
          await loadScript('https://cdn.jsdelivr.net/npm/@creatomate/preview@1.6.0/dist/Preview.min.js');
          
          setTimeout(() => {
            if (!window.Creatomate) {
              throw new Error('Creatomate SDK fallback loaded but not available in window');
            }
            
            console.info('✓ Creatomate SDK loaded from fallback');
            setLoaded(true);
            setLoading(false);
          }, 100);
        } catch (fallbackErr) {
          setError(fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error loading SDK');
          setLoading(false);
        }
      }
    };
    
    loadSDK();
    
    // Cleanup function to handle component unmount
    return () => {
      // Nothing specific to clean up for script loading
    };
  }, []);
  
  // Show error in UI if loading fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Failed to load preview",
        description: error,
        variant: "destructive"
      });
    }
  }, [error]);
  
  // This component doesn't render anything visible
  return null;
}
